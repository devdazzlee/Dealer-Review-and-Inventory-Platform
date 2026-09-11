import { prisma } from "../lib/prisma";

async function main() {
  const totalDealers = await prisma.dealer.count();
  const googlePlaceId = await prisma.dealer.count({ where: { googlePlaceId: { not: null } } });
  const googleRating = await prisma.dealer.count({ where: { googleRating: { not: null } } });
  const yelpRating = await prisma.dealer.count({ where: { yelpRating: { not: null } } });
  const carfaxRating = await prisma.dealer.count({ where: { carfaxRating: { not: null } } });

  console.log("Total dealers:", totalDealers);
  console.log("Have Google Place ID:", googlePlaceId, "missing:", totalDealers - googlePlaceId);
  console.log("Have Google rating:", googleRating);
  console.log("Have Yelp rating:", yelpRating);
  console.log("Have Carfax rating:", carfaxRating);

  for (const job of ["google-place-lookup", "yelp-lookup", "carfax-lookup"]) {
    const runs = await prisma.syncRun.findMany({
      where: { job },
      orderBy: { startedAt: "desc" },
      take: 3,
    });
    console.log(`\n--- ${job} (last 3 runs) ---`);
    console.log(JSON.stringify(runs, null, 2));
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
