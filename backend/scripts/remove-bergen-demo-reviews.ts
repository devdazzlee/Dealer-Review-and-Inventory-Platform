/**
 * Teardown for seed-bergen-demo-reviews.ts.
 *
 * Run:  npx tsx scripts/remove-bergen-demo-reviews.ts
 *
 * Deletes ONLY the demo reviews created by the seed script. A row must match all
 * three markers to be removed:
 *   - belongs to the Bergen Car Company dealer (slug "bergen-car")
 *   - Review.ipAddress === DEMO_MARKER
 *   - Review.email ends with DEMO_EMAIL_DOMAIN
 *
 * Real customer reviews never carry those markers, so they are left untouched.
 * After deleting, the dealer's platform / combined rating is recalculated so the
 * numbers return to exactly what they were before the seed.
 *
 * Safe to run more than once (a second run simply deletes 0 rows).
 */
import { prisma } from "../src/lib/prisma";
import { ratingService } from "../src/services/rating.service";
import {
  DEMO_DEALER_SLUG,
  DEMO_MARKER,
  DEMO_EMAIL_DOMAIN,
} from "./bergen-demo-reviews.data";

async function main() {
  const dealer = await prisma.dealer.findUnique({
    where: { slug: DEMO_DEALER_SLUG },
    select: { id: true, name: true },
  });

  if (!dealer) {
    console.log(
      `Dealer with slug "${DEMO_DEALER_SLUG}" not found. Nothing to remove.`
    );
    return;
  }

  const where = {
    dealerId: dealer.id,
    ipAddress: DEMO_MARKER,
    email: { endsWith: DEMO_EMAIL_DOMAIN },
  };

  const toDelete = await prisma.review.findMany({
    where,
    select: { id: true, authorName: true, email: true },
  });

  console.log(`Dealer: ${dealer.name} (${dealer.id})`);
  console.log(`Demo reviews matched for deletion: ${toDelete.length}`);

  if (toDelete.length === 0) {
    console.log("Nothing to delete. Ratings left as-is.");
    return;
  }

  // ReviewHelpful / ReviewReport rows cascade on delete via the schema.
  const result = await prisma.review.deleteMany({ where });
  console.log(`Deleted ${result.count} demo review(s).`);

  const recalculated = await ratingService.recalculateDealer(dealer.id);
  console.log("\nRatings recalculated for this dealer:");
  console.log(`  platformRating      = ${recalculated.platformRating}`);
  console.log(`  platformReviewCount = ${recalculated.platformReviewCount}`);
  console.log(`  combinedRating      = ${recalculated.combinedRating}`);
  console.log("\nDone. Demo reviews removed; real reviews untouched.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
