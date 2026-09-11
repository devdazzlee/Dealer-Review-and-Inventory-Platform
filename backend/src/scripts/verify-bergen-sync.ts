import { prisma } from "../lib/prisma";

async function main() {
  const since = new Date(Date.now() - 20 * 60 * 1000);
  const updatedRecently = await prisma.vehicle.count({
    where: { dealer: { slug: "bergen-car" }, updatedAt: { gte: since } },
  });
  const active = await prisma.vehicle.count({
    where: { dealer: { slug: "bergen-car" }, isActive: true },
  });
  const total = await prisma.vehicle.count({
    where: { dealer: { slug: "bergen-car" } },
  });

  console.log("Bergen vehicles updated in last 20 min:", updatedRecently);
  console.log("Bergen active / total:", active, "/", total);

  const runs = await prisma.syncRun.findMany({
    where: { job: { in: ["inventory-bergen", "inventory", "inventory-fleet"] } },
    orderBy: { startedAt: "desc" },
    take: 6,
  });
  console.log("\nRecent inventory SyncRun rows:");
  for (const r of runs) {
    console.log(
      `  [${r.job}] ${r.startedAt.toISOString()} -> ${r.finishedAt?.toISOString() ?? "?"} | +${r.added} ~${r.updated} -${r.removed} f${r.failed} | ${r.message}`
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
