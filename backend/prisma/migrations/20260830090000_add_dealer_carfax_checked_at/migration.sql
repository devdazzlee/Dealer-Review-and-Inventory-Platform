-- Tracks the last time the Carfax rating scraper successfully read a dealer's
-- page. Nullable: existing dealers have never been checked. Blocked / not-found
-- scrape attempts deliberately leave this untouched so they are retried next run.
ALTER TABLE "Dealer" ADD COLUMN IF NOT EXISTS "carfaxCheckedAt" TIMESTAMP(3);
