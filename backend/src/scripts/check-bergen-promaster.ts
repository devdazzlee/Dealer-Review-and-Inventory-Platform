import { prisma } from "../lib/prisma";

async function main() {
  const bergen = await prisma.dealer.findFirst({
    where: { OR: [{ slug: "bergen-car" }, { name: { contains: "Bergen", mode: "insensitive" } }] },
    select: { id: true, name: true, slug: true },
  });
  console.log("Bergen dealer:", bergen);
  if (!bergen) return;

  const total = await prisma.vehicle.count({ where: { dealerId: bergen.id } });
  const active = await prisma.vehicle.count({ where: { dealerId: bergen.id, isActive: true } });
  console.log(`Bergen vehicles: ${total} total, ${active} active`);

  const promasters = await prisma.vehicle.findMany({
    where: {
      dealerId: bergen.id,
      model: { contains: "ProMaster", mode: "insensitive" },
    },
    select: {
      vin: true, year: true, make: true, model: true, trim: true,
      isActive: true, updatedAt: true, cachedPhotoCount: true,
    },
  });
  console.log("\nBergen ProMasters in DB:");
  console.log(JSON.stringify(promasters, null, 2));

  const newest = await prisma.vehicle.findMany({
    where: { dealerId: bergen.id, isActive: true },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { year: true, make: true, model: true, createdAt: true, updatedAt: true },
  });
  console.log("\n5 most recently added active Bergen vehicles:");
  console.log(JSON.stringify(newest, null, 2));

  const lastRun = await prisma.syncRun.findFirst({
    where: { job: { in: ["inventory-sync", "inventory-fleet", "inventory"] } },
    orderBy: { startedAt: "desc" },
  });
  console.log("\nLast inventory sync run:", JSON.stringify(lastRun, null, 2));
}

main()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
