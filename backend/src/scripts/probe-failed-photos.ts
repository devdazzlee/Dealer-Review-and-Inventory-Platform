import { prisma } from "../lib/prisma";

/**
 * Takes a sample of vehicles we failed to get photos for and probes the
 * Auto.dev photo CDN directly (retail.photos.vin/<VIN>-1.jpg) to find out
 * whether the photos genuinely don't exist (404) or we just couldn't fetch
 * them (timeout / 403 / 429 / slow).
 */
async function probe(url: string): Promise<string> {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        Referer: "https://www.auto.dev/",
      },
      signal: AbortSignal.timeout(20_000),
    });
    const ms = Date.now() - started;
    const len = res.headers.get("content-length") ?? "?";
    return `HTTP ${res.status} (${ms}ms, ${len} bytes)`;
  } catch (e) {
    const ms = Date.now() - started;
    return `ERROR ${(e as Error).name} (${ms}ms)`;
  }
}

async function main() {
  const sample = await prisma.vehicle.findMany({
    where: { source: "autodev", isActive: true, cachedPhotoCount: 0 },
    orderBy: { photoCacheCheckedAt: "desc" },
    take: 20,
    select: { vin: true, year: true, make: true, model: true, photoCacheAttempts: true },
  });

  let ok = 0;
  let notFound = 0;
  let other = 0;

  for (const v of sample) {
    const url = `https://retail.photos.vin/${v.vin}-1.jpg`;
    const result = await probe(url);
    if (result.startsWith("HTTP 200")) ok += 1;
    else if (result.startsWith("HTTP 404") || result.startsWith("HTTP 403")) notFound += 1;
    else other += 1;
    console.log(
      `${v.vin} ${v.year} ${v.make} ${v.model} [${v.photoCacheAttempts} tries] -> ${result}`
    );
  }

  console.log(`\nSummary of ${sample.length} probed:`);
  console.log(`  200 OK (photo exists, our fetcher is failing):`, ok);
  console.log(`  404/403 (no photo at source):`, notFound);
  console.log(`  timeout/other:`, other);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
