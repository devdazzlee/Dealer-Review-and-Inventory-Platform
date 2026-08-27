import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { isRealDealerWebsite } from "../src/lib/dealer-website";
import { backfillDealerLogo } from "../src/services/dealer-logo.service";
import { fetchPlaceRating, QuotaExceededError } from "../src/services/places.client";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Dealers that already have a googlePlaceId (from a previous run of the
 * daily Place ID lookup job) never get revisited by that job — it only
 * scans dealers *without* one. This is a one-time catch-up: pull each of
 * their real, Google-verified websites (a Details call, not the
 * quota-scarce Text Search) and backfill their logo the same way the
 * ongoing job now does for newly-matched dealers.
 */
async function main() {
  const dealers = await prisma.dealer.findMany({
    where: { logo: null, googlePlaceId: { not: null } },
    select: { id: true, name: true, website: true, logo: true, googlePlaceId: true },
  });

  console.log(`${dealers.length} dealers have a Place ID but no logo yet.`);

  let websitesUpdated = 0;
  let logosAdded = 0;
  let quotaExhausted = false;

  for (const dealer of dealers) {
    try {
      const place = await fetchPlaceRating(dealer.googlePlaceId!);
      const resolvedWebsite =
        place.website && !isRealDealerWebsite(dealer.website) ? place.website : dealer.website;

      if (resolvedWebsite !== dealer.website) {
        await prisma.dealer.update({
          where: { id: dealer.id },
          data: { website: resolvedWebsite },
        });
        websitesUpdated += 1;
      }

      const added = await backfillDealerLogo({ id: dealer.id, website: resolvedWebsite, logo: dealer.logo });
      if (added) {
        logosAdded += 1;
        console.log(`✓ ${dealer.name} -> ${resolvedWebsite}`);
      }
    } catch (err) {
      if (err instanceof QuotaExceededError) {
        quotaExhausted = true;
        console.warn(`Quota exhausted after processing this dealer's batch — stopping.`);
        break;
      }
      console.error(`✗ ${dealer.name}: ${(err as Error).message}`);
    }
    await sleep(300);
  }

  console.log(
    `\nDone${quotaExhausted ? " (stopped early on quota)" : ""}. Websites updated: ${websitesUpdated}, logos added: ${logosAdded}`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
