import { prisma } from "../lib/prisma";

async function main() {
  // Dealers who lost the most to the photoless purge — check they still have
  // a reasonable amount of active inventory left.
  const deactivated = await prisma.vehicle.groupBy({
    by: ["dealerId"],
    where: { source: "autodev", isActive: false, cachedPhotoCount: 0 },
    _count: true,
  });
  deactivated.sort((a, b) => b._count - a._count);

  console.log("Top 12 dealers by deactivated count, with remaining active inventory:\n");
  for (const row of deactivated.slice(0, 12)) {
    const dealer = await prisma.dealer.findUnique({
      where: { id: row.dealerId },
      select: { name: true, slug: true },
    });
    const active = await prisma.vehicle.count({
      where: { dealerId: row.dealerId, isActive: true },
    });
    console.log(
      `${dealer?.name ?? row.dealerId} (${dealer?.slug}) — removed ${row._count}, still has ${active} active`
    );
  }

  const emptied = [];
  for (const row of deactivated) {
    const active = await prisma.vehicle.count({
      where: { dealerId: row.dealerId, isActive: true },
    });
    if (active === 0) {
      const d = await prisma.dealer.findUnique({
        where: { id: row.dealerId },
        select: { name: true, slug: true },
      });
      emptied.push(`${d?.name} (${d?.slug}) — was ${row._count}, now 0`);
    }
  }
  console.log(`\nDealers left with ZERO active inventory: ${emptied.length}`);
  emptied.forEach((e) => console.log("  " + e));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
