import "dotenv/config";
import { prisma } from "../lib/prisma";
import { fetchWithRetry } from "../lib/http";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

/**
 * Moves every vehicle's photos off Cloudinary onto this process's local disk
 * (served as /uploads/vehicles/<vin>/<n>.webp by the backend, same as the
 * existing local-storage fallback in photo-cache.service.ts).
 *
 * Cloudinary's account is now deactivated (401 on every URL, confirmed), so
 * downloading the stored photos[] URLs no longer works. Every remaining
 * vehicle here is Auto.dev-sourced (verified — zero dealer-uploaded ones
 * left in the backlog), so this re-derives each photo from Auto.dev's own
 * photo CDN (retail.photos.vin) instead, using the vehicle's own
 * cachedPhotoCount as the number of indexes to try.
 */

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "vehicles");
const MAX_DIMENSION = 1024;
const QUALITY = 70;
const INDEX_CONCURRENCY = 1;
const VEHICLE_WORKERS = 1;
const BATCH = 50;
const PER_INDEX_TIMEOUT_MS = 20_000;

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  Referer: "https://www.auto.dev/",
  "Accept-Language": "en-US,en;q=0.9",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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

async function downloadFromAutoDev(vin: string, index: number): Promise<Buffer | null> {
  const url = `https://retail.photos.vin/${vin}-${index}.jpg`;
  try {
    const res = await fetchWithRetry(
      url,
      { headers: BROWSER_HEADERS },
      { retries: 1, timeoutMs: PER_INDEX_TIMEOUT_MS }
    );
    if (res.status !== 200) return null;
    const bytes = Buffer.from(await res.arrayBuffer());
    if (bytes.length < 500) return null;
    return bytes;
  } catch {
    return null;
  }
}

/** Downloads indexes 1..maxIndex from Auto.dev's CDN, resizes, saves locally. */
async function migrateVehiclePhotos(vin: string, maxIndex: number): Promise<string[]> {
  const dir = path.join(UPLOAD_ROOT, vin);
  await fs.mkdir(dir, { recursive: true });

  const results: (string | null)[] = new Array(maxIndex).fill(null);
  const queue = Array.from({ length: maxIndex }, (_, i) => i + 1);

  const workers = Array.from(
    { length: Math.min(INDEX_CONCURRENCY, Math.max(queue.length, 1)) },
    async () => {
      for (;;) {
        const index = queue.shift();
        if (!index) return;
        const bytes = await downloadFromAutoDev(vin, index);
        if (!bytes) continue;
        try {
          const resized = await sharp(bytes)
            .rotate()
            .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
            .webp({ quality: QUALITY })
            .toBuffer();
          const filename = `${index}.webp`;
          await fs.writeFile(path.join(dir, filename), resized);
          results[index - 1] = `/uploads/vehicles/${vin}/${filename}`;
        } catch (error) {
          console.error(`[migrate-photos] resize/write failed VIN ${vin} index ${index}`, error);
        }
      }
    }
  );

  await Promise.all(workers);
  return results.filter((u): u is string => u !== null);
}

type PendingVehicle = { vin: string; photos: string[]; cachedPhotoCount: number };

async function findCloudinaryBacked(limit: number): Promise<PendingVehicle[]> {
  return withDbRetry(
    () =>
      prisma.$queryRawUnsafe<PendingVehicle[]>(
        `SELECT vin, photos, "cachedPhotoCount"
         FROM "Vehicle"
         WHERE "cachedPhotoCount" > 0
           AND cardinality(photos) > 0
           AND photos[1] LIKE '%res.cloudinary.com%'
         ORDER BY vin
         LIMIT $1`,
        limit
      ),
    "findCloudinaryBacked"
  );
}

async function drainBatch(): Promise<{ candidates: number; migrated: number; empty: number }> {
  const pending = await findCloudinaryBacked(BATCH);

  let migrated = 0;
  let empty = 0;
  const queue = [...pending];

  const workers = Array.from({ length: Math.min(VEHICLE_WORKERS, queue.length) }, async () => {
    for (;;) {
      const item = queue.shift();
      if (!item) return;
      try {
        const maxIndex = Math.min(30, Math.max(item.cachedPhotoCount, item.photos.length, 1));
        const urls = await migrateVehiclePhotos(item.vin, maxIndex);
        await withDbRetry(
          () =>
            prisma.vehicle.update({
              where: { vin: item.vin },
              data:
                urls.length > 0
                  ? { photos: urls, cachedPhotoCount: urls.length }
                  : { cachedPhotoCount: 0 },
            }),
          `update ${item.vin}`
        );
        console.log(
          `[migrate-photos] ${item.vin}: ${urls.length}/${maxIndex} photos saved locally (from Auto.dev CDN)`
        );
        if (urls.length > 0) migrated += 1;
        else empty += 1;
      } catch (error) {
        console.error(`[migrate-photos] ${item.vin} failed`, error);
      }
    }
  });

  await Promise.all(workers);
  return { candidates: pending.length, migrated, empty };
}

async function main() {
  console.log(`Migrating photos to local disk under ${UPLOAD_ROOT} (source: Auto.dev CDN, Cloudinary is down)`);
  let round = 0;
  let totalMigrated = 0;
  let totalEmpty = 0;
  const t0 = Date.now();

  for (;;) {
    round += 1;
    let r: { candidates: number; migrated: number; empty: number };
    try {
      r = await drainBatch();
    } catch (error) {
      console.error(`[round ${round}] batch failed: ${(error as Error).message?.slice(0, 120)} — retrying in 30s`);
      await sleep(30_000);
      round -= 1;
      continue;
    }
    totalMigrated += r.migrated;
    totalEmpty += r.empty;
    const mins = ((Date.now() - t0) / 60000).toFixed(1);
    console.log(
      `[round ${round}] candidates=${r.candidates} migrated=${r.migrated} empty=${r.empty} | totals migrated=${totalMigrated} empty=${totalEmpty} | ${mins}m`
    );
    if (r.candidates === 0) {
      console.log("No more Cloudinary-backed vehicles found. Migration complete.");
      break;
    }
  }

  console.log(`\nDone. migrated=${totalMigrated} empty=${totalEmpty}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
