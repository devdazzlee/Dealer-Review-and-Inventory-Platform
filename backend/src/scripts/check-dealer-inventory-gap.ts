import { prisma } from "../lib/prisma";

async function main() {
  const total = await prisma.dealer.count({ where: { source: "autodev" } });
  const withV = await prisma.dealer.count({
    where: { source: "autodev", vehicles: { some: {} } },
  });
  console.log("autodev dealers total:", total);
  console.log("with >=1 vehicle:", withV);
  console.log("with 0 vehicles:", total - withV);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
