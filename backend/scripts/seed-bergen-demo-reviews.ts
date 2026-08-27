/**
 * Seed 200 five-star platform reviews for Bergen Car Company (client walkthrough).
 *
 * Run:  npx tsx scripts/seed-bergen-demo-reviews.ts
 *
 * Safe to run more than once. Each review is upserted on (email, dealerId), so a
 * second run updates the same 200 rows instead of creating duplicates.
 *
 * Nothing else is touched: no other dealer, no other review, no ratings config,
 * no schema. Undo everything with:  npx tsx scripts/remove-bergen-demo-reviews.ts
 */
import { prisma } from "../src/lib/prisma";
import { ratingService } from "../src/services/rating.service";
import { REVIEW_STATUS } from "../src/config/constants";
import {
  DEMO_DEALER_SLUG,
  DEMO_MARKER,
  DEMO_EMAIL_DOMAIN,
  DEMO_REVIEWS,
} from "./bergen-demo-reviews.data";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Deterministic spread so the reviews look like they arrived over ~19 months. */
function datesForIndex(i: number, total: number) {
  const oldestDaysAgo = 590;
  const newestDaysAgo = 12;
  const span = oldestDaysAgo - newestDaysAgo;
  const createdDaysAgo = Math.round(oldestDaysAgo - (span * i) / (total - 1));
  const createdAt = new Date(Date.now() - createdDaysAgo * DAY_MS);
  // Visit happened a few days before the review was written.
  const visitGap = 2 + ((i * 3) % 9);
  const visitDate = new Date(createdAt.getTime() - visitGap * DAY_MS);
  return { createdAt, visitDate };
}

async function main() {
  const dealer = await prisma.dealer.findUnique({
    where: { slug: DEMO_DEALER_SLUG },
    select: { id: true, name: true, platformReviewCount: true },
  });

  if (!dealer) {
    throw new Error(
      `Dealer with slug "${DEMO_DEALER_SLUG}" not found. Nothing was changed.`
    );
  }

  console.log(`Dealer: ${dealer.name} (${dealer.id})`);
  console.log(`Existing platform reviews: ${dealer.platformReviewCount}`);
  console.log(`Seeding ${DEMO_REVIEWS.length} demo reviews...`);

  let created = 0;
  let updated = 0;

  for (let i = 0; i < DEMO_REVIEWS.length; i++) {
    const r = DEMO_REVIEWS[i];
    const seq = String(i + 1).padStart(3, "0");
    const email = `bergen-demo-${seq}${DEMO_EMAIL_DOMAIN}`;
    const { createdAt, visitDate } = datesForIndex(i, DEMO_REVIEWS.length);
    const helpfulCount = (i * 7) % 9; // 0..8, organic-looking, deterministic

    const existing = await prisma.review.findUnique({
      where: { email_dealerId: { email, dealerId: dealer.id } },
      select: { id: true },
    });

    const data = {
      authorName: r.name,
      overallRating: 5,
      customerServiceRating: 5,
      qualityRating: 5,
      friendlinessRating: 5,
      pricingRating: 5,
      recommend: true,
      title: r.title,
      comment: r.comment,
      visitDate,
      visitType: r.visitType,
      status: REVIEW_STATUS.approved,
      helpfulCount,
      notHelpfulCount: 0,
      ipAddress: DEMO_MARKER,
      createdAt,
    };

    await prisma.review.upsert({
      where: { email_dealerId: { email, dealerId: dealer.id } },
      create: { ...data, email, dealer: { connect: { id: dealer.id } } },
      update: data,
    });

    if (existing) updated++;
    else created++;
  }

  console.log(`Inserted: ${created}  |  Updated existing: ${updated}`);

  const recalculated = await ratingService.recalculateDealer(dealer.id);
  console.log("\nRatings recalculated for this dealer:");
  console.log(`  platformRating      = ${recalculated.platformRating}`);
  console.log(`  platformReviewCount = ${recalculated.platformReviewCount}`);
  console.log(`  combinedRating      = ${recalculated.combinedRating}`);
  console.log("\nDone. Reviews are approved and live on the dealer page.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
