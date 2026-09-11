import { prisma } from "../lib/prisma";

async function main() {
  const totalDealers = await prisma.dealer.count();
  const dealersWithVehicles = await prisma.dealer.count({
    where: { vehicles: { some: {} } },
  });
  const totalVehicles = await prisma.vehicle.count();

  console.log("Total dealers:", totalDealers);
  console.log("Dealers with at least 1 vehicle:", dealersWithVehicles);
  console.log("Total vehicles in DB:", totalVehicles);

  const runs = await prisma.syncRun.findMany({
    where: { job: "inventory-sync" },
    orderBy: { startedAt: "desc" },
    take: 5,
  });
  console.log("\nLast 5 inventory-sync runs:");
  console.log(JSON.stringify(runs, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
