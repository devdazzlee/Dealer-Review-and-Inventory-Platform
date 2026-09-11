import { prisma } from "../lib/prisma";

/**
 * Hides Auto.dev-sourced vehicles that have no photo available. Auto.dev is
 * the only photo source and it has nothing for these VINs (many no longer
 * have a live listing at all). Setting isActive:false removes them from
 * every public list / detail / dealer page.
 *
 * Self-correcting: if a dealer's inventory later syncs and the VIN is still
 * for sale, listingPayload sets isActive:true again — with photos if
 * Auto.dev has them by then.
 */
async function main() {
  const target = {
    source: "autodev",
    isActive: true,
    cachedPhotoCount: 0,
  } as const;

  const count = await prisma.vehicle.count({ where: target });
  const byDealer = await prisma.vehicle.groupBy({
    by: ["dealerId"],
    where: target,
    _count: true,
  });

  console.log(`Photoless active Auto.dev vehicles: ${count}`);
  console.log(`Spread across ${byDealer.length} dealers`);
  const maxOne = Math.max(...byDealer.map((d) => d._count));
  console.log(`Most from any single dealer: ${maxOne}`);

  const res = await prisma.vehicle.updateMany({
    where: target,
    data: { isActive: false },
  });
  console.log(`\nDeactivated ${res.count} vehicles.`);

  const remainingActive = await prisma.vehicle.count({
    where: { source: "autodev", isActive: true },
  });
  const remainingNoPhoto = await prisma.vehicle.count({
    where: { source: "autodev", isActive: true, cachedPhotoCount: 0 },
  });
  console.log(`Active Auto.dev vehicles now: ${remainingActive}`);
  console.log(`...of which still without a photo: ${remainingNoPhoto}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
