import "dotenv/config";
import { prisma } from "../lib/prisma";
import { cacheListingPhotos } from "../services/photo-cache.service";
import { withTimeout } from "../lib/http";

/**
 * Faster manual drain of the photo backlog. Same DB fields and same
 * cacheListingPhotos logic the cron job uses, but with more parallelism and
 * a tighter per-VIN cap so the many VINs that simply have no photos on the
 * CDN fail in ~20s instead of dragging the whole batch for 60s each. The
 * production photo-catchup cron is untouched.
 */

// Low concurrency on purpose: 20 workers x ~30 images each overwhelmed the
// retail.photos.vin CDN, it throttled us, and every VIN then timed out with
// zero photos saved. A single VIN on its own caches all 30 photos in ~14s,
// so 7 in parallel stays well under the throttle threshold.
const WORKERS = 7;
// Generous per-VIN cap so a 30+ photo gallery always finishes even under
// mild contention, and many retries before a VIN is abandoned.
const PER_VIN_TIMEOUT_MS = 150_000;
const BATCH = 300;
const MAX_ATTEMPTS = 15;

async function drainBatch(): Promise<{ candidates: number; cached: number; failed: number }> {
  const vehicles = await prisma.vehicle.findMany({
    where: {
      source: "autodev",
      isActive: true,
      cachedPhotoCount: 0,
      photoCacheAttempts: { lt: MAX_ATTEMPTS },
    },
    orderBy: [{ photoCacheCheckedAt: { sort: "asc", nulls: "first" } }],
    take: BATCH,
    select: { vin: true, photoCacheAttempts: true },
  });

  let cached = 0;
  let failed = 0;
  const queue = [...vehicles];

  const workers = Array.from({ length: Math.min(WORKERS, queue.length) }, async () => {
    for (;;) {
      const item = queue.shift();
      if (!item) return;
      try {
        const urls = await withTimeout(
          cacheListingPhotos(item.vin),
          PER_VIN_TIMEOUT_MS,
          `VIN ${item.vin}`
        );
        await prisma.vehicle.update({
          where: { vin: item.vin },
          data: {
            ...(urls.length > 0
              ? { photos: urls, cachedPhotoCount: urls.length }
              : {}),
            photoCacheAttempts: item.photoCacheAttempts + 1,
            photoCacheCheckedAt: new Date(),
          },
        });
        if (urls.length > 0) cached += 1;
        else failed += 1;
      } catch {
        failed += 1;
        try {
          await prisma.vehicle.update({
            where: { vin: item.vin },
            data: {
              photoCacheAttempts: item.photoCacheAttempts + 1,
              photoCacheCheckedAt: new Date(),
            },
          });
        } catch {
          /* ignore */
        }
      }
    }
  });

  await Promise.all(workers);
  return { candidates: vehicles.length, cached, failed };
}

async function main() {
  let round = 0;
  let totalCached = 0;
  let totalFailed = 0;
  const startedAt = Date.now();

  for (;;) {
    round += 1;
    const r = await drainBatch();
    totalCached += r.cached;
    totalFailed += r.failed;
    const mins = ((Date.now() - startedAt) / 60000).toFixed(1);
    console.log(
      `[round ${round}] candidates=${r.candidates} cached=${r.cached} noPhotoOrFail=${r.failed} | totals cached=${totalCached} failed=${totalFailed} | ${mins}m elapsed`
    );
    if (r.candidates === 0) {
      console.log("Backlog drained (remaining are all maxed-out attempts).");
      break;
    }
  }

  console.log(`\nDone. cached=${totalCached} failed=${totalFailed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
