import "dotenv/config";
import { prisma } from "../lib/prisma";

/**
 * Fast photo backfill using Cloudinary fetch mode.
 *
 * The old path downloaded every photo and re-uploaded it to Cloudinary one
 * by one (~4.5s each, ~134s for a 30-photo vehicle), which collapsed under
 * concurrency and saved nothing. Instead we just probe which photo indexes
 * exist on retail.photos.vin (a few hundred ms each) and store Cloudinary
 * fetch URLs — Cloudinary pulls + caches each image itself, lazily, the
 * first time a visitor views it. No uploads, no storage blowout.
 */

const CLOUD_NAME = (() => {
  const url = process.env.CLOUDINARY_URL ?? "";
  const m = url.match(/@([^/\s]+)/);
  if (!m) throw new Error("CLOUDINARY_URL not set / cloud name not found");
  return m[1];
})();

const SOURCE = (vin: string, i: number) =>
  `https://retail.photos.vin/${vin}-${i}.jpg`;
const FETCH_URL = (vin: string, i: number) =>
  `https://res.cloudinary.com/${CLOUD_NAME}/image/fetch/f_auto,q_auto/${SOURCE(vin, i)}`;

const VIN_WORKERS = 6;
const MAX_INDEX = 40;
const INDEX_CONCURRENCY = 10;
const PROBE_TIMEOUT_MS = 15_000;
const BATCH = 600;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Neon (serverless) drops idle connections and has brief outages; retry a
 * DB op a few times with backoff instead of letting one blip kill the run. */
async function withDbRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 1; attempt <= 6; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const msg = (e as Error).message ?? "";
      const transient =
        msg.includes("Can't reach database") ||
        msg.includes("Response from the Engine was empty") ||
        msg.includes("Engine is not yet connected") ||
        msg.includes("Connection") ||
        (e as { code?: string }).code === "P1001" ||
        (e as { code?: string }).code === "P1017";
      if (!transient) throw e;
      const wait = Math.min(30_000, 2 ** attempt * 1000);
      console.warn(`[db-retry] ${label} attempt ${attempt} failed (${msg.slice(0, 80)}), waiting ${wait}ms`);
      await sleep(wait);
    }
  }
  throw lastErr;
}

async function probeIndex(vin: string, i: number): Promise<boolean> {
  try {
    const res = await fetch(SOURCE(vin, i), {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.auto.dev/",
        Range: "bytes=0-0",
      },
      signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    });
    return res.status === 200 || res.status === 206;
  } catch {
    return false;
  }
}

/** Returns the count of contiguous photos starting at index 1. */
async function countPhotos(vin: string): Promise<number> {
  let found = 0;
  for (let start = 1; start <= MAX_INDEX; start += INDEX_CONCURRENCY) {
    const batch = Array.from(
      { length: Math.min(INDEX_CONCURRENCY, MAX_INDEX - start + 1) },
      (_, k) => start + k
    );
    const results = await Promise.all(batch.map((i) => probeIndex(vin, i)));
    let localRun = 0;
    for (const ok of results) {
      if (ok) localRun += 1;
      else {
        return found + localRun;
      }
    }
    found += localRun;
  }
  return found;
}

async function drainBatch(): Promise<{ candidates: number; withPhotos: number; empty: number }> {
  const vehicles = await withDbRetry(
    () =>
      prisma.vehicle.findMany({
        where: {
          source: "autodev",
          isActive: true,
          cachedPhotoCount: 0,
          photoCacheAttempts: { lt: 15 },
        },
        orderBy: [{ photoCacheCheckedAt: { sort: "asc", nulls: "first" } }],
        take: BATCH,
        select: { vin: true, photoCacheAttempts: true },
      }),
    "findMany"
  );

  let withPhotos = 0;
  let empty = 0;
  const queue = [...vehicles];

  const workers = Array.from({ length: Math.min(VIN_WORKERS, queue.length) }, async () => {
    for (;;) {
      const item = queue.shift();
      if (!item) return;
      try {
        const n = await countPhotos(item.vin);
        const urls = Array.from({ length: n }, (_, k) => FETCH_URL(item.vin, k + 1));
        await withDbRetry(
          () =>
            prisma.vehicle.update({
              where: { vin: item.vin },
              data: {
                ...(n > 0 ? { photos: urls, cachedPhotoCount: n } : {}),
                photoCacheAttempts: item.photoCacheAttempts + 1,
                photoCacheCheckedAt: new Date(),
              },
            }),
          `update ${item.vin}`
        );
        if (n > 0) withPhotos += 1;
        else empty += 1;
      } catch (e) {
        console.error(`[skip] ${item.vin}: ${(e as Error).message?.slice(0, 100)}`);
      }
    }
  });

  await Promise.all(workers);
  return { candidates: vehicles.length, withPhotos, empty };
}

async function main() {
  console.log(`Cloud: ${CLOUD_NAME} — fetch-mode backfill starting`);
  let round = 0;
  let totalWith = 0;
  let totalEmpty = 0;
  const t0 = Date.now();

  for (;;) {
    round += 1;
    let r: { candidates: number; withPhotos: number; empty: number };
    try {
      r = await drainBatch();
    } catch (e) {
      console.error(`[round ${round}] batch failed: ${(e as Error).message?.slice(0, 120)} — waiting 30s and retrying`);
      await sleep(30_000);
      round -= 1;
      continue;
    }
    totalWith += r.withPhotos;
    totalEmpty += r.empty;
    const mins = ((Date.now() - t0) / 60000).toFixed(1);
    console.log(
      `[round ${round}] candidates=${r.candidates} withPhotos=${r.withPhotos} empty=${r.empty} | totals withPhotos=${totalWith} empty=${totalEmpty} | ${mins}m`
    );
    if (r.candidates === 0) {
      console.log("Backlog drained.");
      break;
    }
  }
  console.log(`\nDone. withPhotos=${totalWith} empty=${totalEmpty}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
