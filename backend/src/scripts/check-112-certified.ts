import { prisma } from "../lib/prisma";

async function main() {
  const dealer = await prisma.dealer.findUnique({ where: { slug: "112-certified" } });
  console.log("Dealer:", dealer?.id, dealer?.name, dealer?.slug);
  if (dealer) {
    const count = await prisma.vehicle.count({ where: { dealerId: dealer.id } });
    console.log("Vehicle count for this dealer:", count);
    const sample = await prisma.vehicle.findMany({
      where: { dealerId: dealer.id },
      take: 3,
    });
    console.log(
      "Sample:",
      JSON.stringify(
        sample.map((v) => ({ id: v.id, year: v.year, make: v.make, model: v.model })),
        null,
        2
      )
    );
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
