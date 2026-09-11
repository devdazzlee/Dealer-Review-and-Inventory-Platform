import { syncAllAutoDevDealers } from "../services/inventory-sync.service";

async function main() {
  console.log("Triggering fleet inventory sync now...");
  const result = await syncAllAutoDevDealers();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  });
