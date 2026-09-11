import { prisma } from "../lib/prisma";

/**
 * The bulk photo catch-up was failing ~9k VINs not because their photos are
 * missing (probing the CDN directly returns them fine) but because running
 * 20 workers x 30 images at once got us throttled into timeouts. Those VINs
 * now carry 2-3 "attempts" toward the give-up ceiling for failures that
 * were our fault. Reset them so both this script and the 30-min cron retry
 * them cleanly with the corrected low-concurrency approach.
 */
async function main() {
  const res = await prisma.vehicle.updateMany({
    where: { source: "autodev", isActive: true, cachedPhotoCount: 0 },
    data: { photoCacheAttempts: 0, photoCacheCheckedAt: null },
  });
  console.log(`Reset photoCacheAttempts/checkedAt for ${res.count} vehicles.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
