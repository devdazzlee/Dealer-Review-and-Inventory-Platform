import cron from "node-cron";
import {
  syncAllAutoDevDealers,
  cachePendingVehiclePhotos,
} from "./inventory-sync.service";
import { syncGoogleRatings } from "./ratings-sync.service";
import { discoverRealDealers } from "./dealer-discovery.service";
import { bulkAssignGooglePlaceIds } from "./google-place-lookup.service";
import { bulkAssignYelpRatings } from "./yelp-lookup.service";
import { bulkAssignCarfaxRatings } from "./carfax-lookup.service";
import { postDailyBergenReview } from "./daily-review.service";

let started = false;

export async function runInventoryJob() {
  return syncAllAutoDevDealers();
}

export async function runPhotoCatchupJob() {
  return cachePendingVehiclePhotos();
}

export async function runRatingsJob() {
  return syncGoogleRatings();
}

export async function runDealerDiscoveryJob() {
  return discoverRealDealers();
}

export async function runGooglePlaceLookupJob() {
  return bulkAssignGooglePlaceIds();
}

export async function runYelpLookupJob() {
  return bulkAssignYelpRatings();
}

export async function runCarfaxLookupJob() {
  return bulkAssignCarfaxRatings();
}

export async function runDailyReviewJob() {
  return postDailyBergenReview();
}

export function startScheduledJobs() {
  if (started) return;
  started = true;

  cron.schedule("0 2 * * *", () => {
    console.log("[cron] inventory-sync firing");
    void runInventoryJob().catch((error) =>
      console.error("[cron] inventory", error)
    );
  });

  cron.schedule("0 3 * * *", () => {
    console.log("[cron] ratings-sync firing");
    void runRatingsJob().catch((error) =>
      console.error("[cron] ratings", error)
    );
  });

  // Weekly, not daily — discovery is a slow multi-region scan, not a
  // per-vehicle refresh, so it doesn't need to run every day.
  cron.schedule("0 4 * * 0", () => {
    console.log("[cron] dealer-discovery firing");
    void runDealerDiscoveryJob().catch((error) =>
      console.error("[cron] dealer-discovery", error)
    );
  });

  // Daily, not weekly — Google's default Places API quota for a new
  // project is a hard 100 SearchTextRequest/day, so a large backlog of
  // dealers only clears a hundred at a time regardless of how often this
  // runs. Running it daily lets that quota refill and chip away at the
  // backlog continuously instead of stalling for a week between batches.
  cron.schedule("30 3 * * *", () => {
    console.log("[cron] google-place-lookup firing");
    void runGooglePlaceLookupJob().catch((error) =>
      console.error("[cron] google-place-lookup", error)
    );
  });

  // Daily, offset from the Google lookup (03:30) so the two never compete
  // for the same request budget. Yelp's trial/paid plans cap requests per
  // day rather than per month, so a large backlog only clears a batch at a
  // time regardless of run frequency — daily lets that cap refill and chip
  // away at the backlog continuously.
  cron.schedule("30 4 * * *", () => {
    console.log("[cron] yelp-lookup firing");
    void runYelpLookupJob().catch((error) =>
      console.error("[cron] yelp-lookup", error)
    );
  });

  // Daily at 05:15 — offset from the Google (03:30) and Yelp (04:30) lookups
  // so the three rating jobs never overlap. This one is a slow HTML scrape
  // with deliberate multi-second pacing and a per-run cap, so a large backlog
  // clears a few hundred dealers a night; the refresh interval
  // (CARFAX_REFRESH_DAYS) keeps steady-state runs small.
  cron.schedule("15 5 * * *", () => {
    console.log("[cron] carfax-lookup firing");
    void runCarfaxLookupJob().catch((error) =>
      console.error("[cron] carfax-lookup", error)
    );
  });

  // Daily at 10:00 America/New_York — posts one fresh 5-star platform review
  // for Bergen Car (and only Bergen Car). Content is drawn from a large local
  // bank and de-duplicated against everything already in the DB, so it never
  // repeats a name, title, or comment. See daily-review.service.ts.
  cron.schedule(
    "0 10 * * *",
    () => {
      console.log("[cron] daily-review firing");
      void runDailyReviewJob().catch((error) =>
        console.error("[cron] daily-review", error)
      );
    },
    { timezone: "America/New_York" }
  );

  // Every 30 minutes — the vehicle-data fleet sync (02:00) intentionally
  // defers photo downloads to keep dealer data appearing quickly, so this
  // is what actually clears that backlog. Not daily-quota-limited like
  // Places, so it can run often and work through thousands of vehicles
  // over a day or two instead of the weeks a single nightly pass would take.
  cron.schedule("*/30 * * * *", () => {
    console.log("[cron] photo-catchup firing");
    void runPhotoCatchupJob().catch((error) =>
      console.error("[cron] photo-catchup", error)
    );
  });

  console.log(
    "Scheduled inventory sync at 02:00, ratings sync at 03:00, Google Place ID lookup at 03:30, dealer discovery Sundays at 04:00, Yelp lookup at 04:30, Carfax scrape at 05:15, photo catch-up every 30 minutes, Bergen Car daily review at 10:00 America/New_York"
  );
}
