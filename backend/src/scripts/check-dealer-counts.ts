import { prisma } from "../lib/prisma";

async function main() {
  const total = await prisma.dealer.count();
  const real = await prisma.dealer.count({ where: { autoDevDealerId: { not: null } } });
  const placeholder = total - real;
  const runs = await prisma.syncRun.findMany({
    where: { job: "dealer-discovery" },
    orderBy: { startedAt: "desc" },
    take: 5,
  });
  console.log("Total dealers:", total);
  console.log("Real (auto.dev):", real);
  console.log("Placeholder:", placeholder);
  console.log("Recent dealer-discovery runs:", JSON.stringify(runs, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
