import "dotenv/config";
import { syncBergenInventory } from "../services/inventory-sync.service";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Triggering Bergen inventory sync (bergenAutoDev key)...");
  const result = await syncBergenInventory();
  console.log(JSON.stringify(result, null, 2));

  const runs = await prisma.syncRun.findMany({
    where: { job: "inventory-bergen" },
    orderBy: { startedAt: "desc" },
    take: 3,
  });
  console.log("\nLast 3 inventory-bergen SyncRun rows:");
  console.log(JSON.stringify(runs, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
