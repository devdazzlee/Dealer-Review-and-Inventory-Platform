import "dotenv/config";
import { cachePendingVehiclePhotos } from "../src/services/inventory-sync.service";

async function main() {
  const result = await cachePendingVehiclePhotos();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
