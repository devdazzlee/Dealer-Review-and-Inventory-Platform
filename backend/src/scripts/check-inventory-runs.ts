import { prisma } from "../lib/prisma";

async function main() {
  for (const job of ["inventory", "inventory-fleet"]) {
    const runs = await prisma.syncRun.findMany({
      where: { job },
      orderBy: { startedAt: "desc" },
      take: 4,
    });
    console.log(`\n--- ${job} (last 4 runs) ---`);
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
