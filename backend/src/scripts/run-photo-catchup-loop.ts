import { cachePendingVehiclePhotos } from "../services/inventory-sync.service";
import { prisma } from "../lib/prisma";

/**
 * Manually drives the same photo-catchup logic the 30-min cron uses, but in
 * a tight loop with a bigger batch, to work through the post-fleet-sync
 * photo backlog (~17k vehicles) much faster than one 100-vehicle pass every
 * half hour would. Safe to run: it's the exact same function/DB fields the
 * cron job uses, so the cron won't duplicate or conflict with this.
 */
async function main() {
  let totalCached = 0;
  let totalFailed = 0;
  let round = 0;

  for (;;) {
    round += 1;
    const result = await cachePendingVehiclePhotos(300);
    totalCached += result.cached;
    totalFailed += result.failed;
    console.log(
      `[round ${round}] ${result.message} | running totals: cached=${totalCached} failed=${totalFailed}`
    );
    if (result.candidates === 0) {
      console.log("No more candidates — backlog cleared (or all maxed out attempts).");
      break;
    }
  }

  console.log(`\nDone. Total cached this run: ${totalCached}, total failed: ${totalFailed}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
