import { prisma } from "../lib/prisma";

async function main() {
  const totalAutodev = await prisma.vehicle.count({
    where: { source: "autodev", isActive: true },
  });
  const zeroPhotos = await prisma.vehicle.count({
    where: { source: "autodev", isActive: true, cachedPhotoCount: 0 },
  });
  const neverChecked = await prisma.vehicle.count({
    where: {
      source: "autodev",
      isActive: true,
      cachedPhotoCount: 0,
      photoCacheCheckedAt: null,
    },
  });
  const maxedOut = await prisma.vehicle.count({
    where: {
      source: "autodev",
      isActive: true,
      cachedPhotoCount: 0,
      photoCacheAttempts: { gte: 5 },
    },
  });
  const withPhotos = totalAutodev - zeroPhotos;

  console.log("Total active autodev vehicles:", totalAutodev);
  console.log("With at least 1 cached photo:", withPhotos);
  console.log("Zero cached photos:", zeroPhotos);
  console.log("  - never attempted yet:", neverChecked);
  console.log("  - maxed out (>=5 attempts, gave up):", maxedOut);

  const runs = await prisma.syncRun.findMany({
    where: { job: "photo-catchup" },
    orderBy: { startedAt: "desc" },
    take: 8,
  });
  console.log("\nLast 8 photo-catchup runs:");
  for (const r of runs) {
    console.log(
      `${r.startedAt.toISOString()} -> ${r.finishedAt?.toISOString() ?? "running"} | updated=${r.updated} failed=${r.failed} | ${r.message}`
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
