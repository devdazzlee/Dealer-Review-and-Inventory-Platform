import cron from "node-cron";
import { syncBergenInventory } from "./inventory-sync.service";
import { syncGoogleRatings } from "./ratings-sync.service";

let started = false;

export async function runInventoryJob() {
  return syncBergenInventory();
}

export async function runRatingsJob() {
  return syncGoogleRatings();
}

export function startScheduledJobs() {
  if (started) return;
  started = true;

  cron.schedule("0 2 * * *", () => {
    void runInventoryJob().catch((error) =>
      console.error("[cron] inventory", error)
    );
  });

  cron.schedule("0 3 * * *", () => {
    void runRatingsJob().catch((error) =>
      console.error("[cron] ratings", error)
    );
  });

  console.log("Scheduled inventory sync at 02:00 and ratings sync at 03:00");
}
