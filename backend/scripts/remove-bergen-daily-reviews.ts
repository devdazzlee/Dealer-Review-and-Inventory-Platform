/**
 * Rollback for the automated daily review poster (daily-review.service.ts).
 *
 * Run:  npx tsx scripts/remove-bergen-daily-reviews.ts
 *       npx tsx scripts/remove-bergen-daily-reviews.ts --keep 30   (keep newest 30)
 *
 * Deletes ONLY rows the daily poster created. A review must match all three:
 *   - belongs to the Bergen Car Company dealer (slug "bergen-car")
 *   - Review.ipAddress === "DAILY_REVIEW_BOT"
 *   - Review.email ends with "@bergen-daily-review.invalid"
 *
 * Real customer reviews and the separate demo-seed reviews never carry these
 * markers, so they are untouched. Ratings are recalculated afterward.
 * Safe to run repeatedly.
 */
import { prisma } from "../src/lib/prisma";
import { ratingService } from "../src/services/rating.service";
import {
  DAILY_REVIEW_DEALER_SLUG,
  DAILY_REVIEW_MARKER,
  DAILY_REVIEW_EMAIL_DOMAIN,
} from "../src/services/daily-review.service";

async function main() {
  const keepArg = process.argv.indexOf("--keep");
  const keep = keepArg !== -1 ? Math.max(0, parseInt(process.argv[keepArg + 1] ?? "0", 10)) : 0;

  const dealer = await prisma.dealer.findUnique({
    where: { slug: DAILY_REVIEW_DEALER_SLUG },
    select: { id: true, name: true },
  });
  if (!dealer) {
    console.log(`Dealer "${DAILY_REVIEW_DEALER_SLUG}" not found. Nothing to do.`);
    return;
  }

  const baseWhere = {
    dealerId: dealer.id,
    ipAddress: DAILY_REVIEW_MARKER,
    email: { endsWith: DAILY_REVIEW_EMAIL_DOMAIN },
  };

  const all = await prisma.review.findMany({
    where: baseWhere,
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  const targets = keep > 0 ? all.slice(keep) : all;
  console.log(`Dealer: ${dealer.name} (${dealer.id})`);
  console.log(`Daily-bot reviews found: ${all.length}`);
  console.log(keep > 0 ? `Keeping newest ${keep}, deleting ${targets.length}` : `Deleting all ${targets.length}`);

  if (targets.length === 0) {
    console.log("Nothing to delete. Ratings left as-is.");
    return;
  }

  const result = await prisma.review.deleteMany({
    where: { id: { in: targets.map((r) => r.id) } },
  });
  console.log(`Deleted ${result.count} review(s).`);

  const updated = await ratingService.recalculateDealer(dealer.id);
  console.log("\nRatings recalculated:");
  console.log(`  platformRating      = ${updated.platformRating}`);
  console.log(`  platformReviewCount = ${updated.platformReviewCount}`);
  console.log(`  combinedRating      = ${updated.combinedRating}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
