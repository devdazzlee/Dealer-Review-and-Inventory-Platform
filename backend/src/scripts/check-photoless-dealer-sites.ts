import { prisma } from "../lib/prisma";

async function main() {
  // The vehicles we just hid for having no photo
  const hidden = await prisma.vehicle.findMany({
    where: { source: "autodev", isActive: false, cachedPhotoCount: 0 },
    select: { vin: true, dealerId: true, year: true, make: true, model: true },
  });

  const dealerIds = [...new Set(hidden.map((v) => v.dealerId))];
  const dealers = await prisma.dealer.findMany({
    where: { id: { in: dealerIds } },
    select: { id: true, name: true, website: true },
  });
  const byId = new Map(dealers.map((d) => [d.id, d]));

  let withSite = 0;
  let withoutSite = 0;
  for (const v of hidden) {
    const d = byId.get(v.dealerId);
    if (d?.website) withSite += 1;
    else withoutSite += 1;
  }

  console.log(`Hidden photoless vehicles: ${hidden.length}`);
  console.log(`  dealer has a website on file: ${withSite}`);
  console.log(`  dealer has NO website on file: ${withoutSite}`);
  console.log(`\nDealers involved: ${dealers.length}, with website: ${dealers.filter((d) => d.website).length}`);
  console.log("\nSample dealer sites:");
  dealers.slice(0, 12).forEach((d) => console.log(`  ${d.name}: ${d.website ?? "(none)"}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
