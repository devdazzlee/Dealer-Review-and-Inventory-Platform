/**
 * One-time data migration: old Review.rating → new review schema.
 * Run with: npx tsx prisma/migrate-reviews.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Migrating Review table to Milestone 2 schema...");

  // Add new columns (idempotent) while old `rating` still exists
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Review"
      ADD COLUMN IF NOT EXISTS "email" TEXT,
      ADD COLUMN IF NOT EXISTS "overallRating" INTEGER,
      ADD COLUMN IF NOT EXISTS "customerServiceRating" INTEGER,
      ADD COLUMN IF NOT EXISTS "qualityRating" INTEGER,
      ADD COLUMN IF NOT EXISTS "friendlinessRating" INTEGER,
      ADD COLUMN IF NOT EXISTS "pricingRating" INTEGER,
      ADD COLUMN IF NOT EXISTS "recommend" BOOLEAN,
      ADD COLUMN IF NOT EXISTS "title" TEXT,
      ADD COLUMN IF NOT EXISTS "visitDate" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "visitType" TEXT,
      ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'pending',
      ADD COLUMN IF NOT EXISTS "helpfulCount" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "notHelpfulCount" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "ipAddress" TEXT,
      ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3)
  `);

  // Detect legacy rating column
  const cols = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'Review' AND column_name = 'rating'
  `;

  if (cols.length > 0) {
    await prisma.$executeRawUnsafe(`
      UPDATE "Review"
      SET
        "overallRating" = COALESCE("overallRating", "rating"),
        "email" = COALESCE("email", CONCAT('legacy+', id, '@migrated.local')),
        "title" = COALESCE(
          "title",
          CASE
            WHEN length("comment") > 80 THEN left("comment", 77) || '...'
            ELSE "comment"
          END
        ),
        "status" = COALESCE(NULLIF("status", ''), 'approved'),
        "helpfulCount" = COALESCE("helpfulCount", 0),
        "notHelpfulCount" = COALESCE("notHelpfulCount", 0),
        "updatedAt" = COALESCE("updatedAt", "createdAt")
    `);

    await prisma.$executeRawUnsafe(`ALTER TABLE "Review" DROP COLUMN "rating"`);
    console.log("Copied rating → overallRating and dropped legacy rating column.");
  } else {
    await prisma.$executeRawUnsafe(`
      UPDATE "Review"
      SET
        "email" = COALESCE("email", CONCAT('legacy+', id, '@migrated.local')),
        "overallRating" = COALESCE("overallRating", 5),
        "title" = COALESCE("title", 'Customer review'),
        "status" = COALESCE(NULLIF("status", ''), 'approved'),
        "helpfulCount" = COALESCE("helpfulCount", 0),
        "notHelpfulCount" = COALESCE("notHelpfulCount", 0),
        "updatedAt" = COALESCE("updatedAt", "createdAt")
      WHERE "email" IS NULL OR "overallRating" IS NULL OR "title" IS NULL OR "updatedAt" IS NULL
    `);
  }

  // Enforce NOT NULL on required columns
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Review"
      ALTER COLUMN "email" SET NOT NULL,
      ALTER COLUMN "overallRating" SET NOT NULL,
      ALTER COLUMN "title" SET NOT NULL,
      ALTER COLUMN "updatedAt" SET NOT NULL,
      ALTER COLUMN "status" SET DEFAULT 'pending',
      ALTER COLUMN "helpfulCount" SET DEFAULT 0,
      ALTER COLUMN "notHelpfulCount" SET DEFAULT 0
  `);

  // Dealer rating columns
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "Dealer"
      ADD COLUMN IF NOT EXISTS "googleRating" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "googleReviewCount" INTEGER,
      ADD COLUMN IF NOT EXISTS "yelpRating" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "yelpReviewCount" INTEGER,
      ADD COLUMN IF NOT EXISTS "carfaxRating" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "carfaxUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "autoSalesReviewsRating" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "platformRating" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "platformReviewCount" INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS "combinedRating" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "manualRatingOverride" DOUBLE PRECISION,
      ADD COLUMN IF NOT EXISTS "useManualRating" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "hasBadge" BOOLEAN DEFAULT false,
      ADD COLUMN IF NOT EXISTS "badgeYear" INTEGER
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "Dealer"
    SET
      "platformReviewCount" = COALESCE("platformReviewCount", 0),
      "useManualRating" = COALESCE("useManualRating", false),
      "hasBadge" = COALESCE("hasBadge", false)
  `);

  // Create ReviewHelpful if missing
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "ReviewHelpful" (
      "id" TEXT NOT NULL,
      "reviewId" TEXT NOT NULL,
      "ipAddress" TEXT NOT NULL,
      "helpful" BOOLEAN NOT NULL,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ReviewHelpful_pkey" PRIMARY KEY ("id")
    )
  `);

  await prisma.$executeRawUnsafe(`
    CREATE UNIQUE INDEX IF NOT EXISTS "ReviewHelpful_reviewId_ipAddress_key"
      ON "ReviewHelpful"("reviewId", "ipAddress")
  `);

  // Create RatingSourceSettings if missing
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "RatingSourceSettings" (
      "id" TEXT NOT NULL,
      "googleEnabled" BOOLEAN NOT NULL DEFAULT true,
      "yelpEnabled" BOOLEAN NOT NULL DEFAULT true,
      "carfaxEnabled" BOOLEAN NOT NULL DEFAULT true,
      "autoSalesReviewsEnabled" BOOLEAN NOT NULL DEFAULT true,
      "platformEnabled" BOOLEAN NOT NULL DEFAULT true,
      "updatedAt" TIMESTAMP(3) NOT NULL,
      CONSTRAINT "RatingSourceSettings_pkey" PRIMARY KEY ("id")
    )
  `);

  // Indexes / unique constraints
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Review_status_idx" ON "Review"("status")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Review_email_dealerId_idx" ON "Review"("email", "dealerId")
  `);
  await prisma.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS "Dealer_combinedRating_idx" ON "Dealer"("combinedRating")
  `);

  // Unique email+dealerId — drop duplicates first keeping earliest
  await prisma.$executeRawUnsafe(`
    DELETE FROM "Review" a
    USING "Review" b
    WHERE a.id > b.id
      AND lower(a.email) = lower(b.email)
      AND a."dealerId" = b."dealerId"
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "Review" ADD CONSTRAINT "Review_email_dealerId_key" UNIQUE ("email", "dealerId");
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      ALTER TABLE "ReviewHelpful"
        ADD CONSTRAINT "ReviewHelpful_reviewId_fkey"
        FOREIGN KEY ("reviewId") REFERENCES "Review"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$
  `);

  console.log("Migration SQL complete. Run prisma db push to sync remaining diffs, then seed if desired.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
