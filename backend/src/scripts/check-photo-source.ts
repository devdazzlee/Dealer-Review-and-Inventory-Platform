import { prisma } from "../lib/prisma";

async function main() {
  const base = { source: "autodev", isActive: true, cachedPhotoCount: 0 } as const;

  const zeroNoCount = await prisma.vehicle.count({
    where: { ...base, OR: [{ photoCount: 0 }, { photoCount: null }] },
  });
  const zeroWithCount = await prisma.vehicle.count({
    where: { ...base, photoCount: { gt: 0 } },
  });

  console.log("Vehicles with 0 cached photos:");
  console.log("  Auto.dev source also reports 0 photos (nothing to fetch):", zeroNoCount);
  console.log("  Auto.dev source says photos exist, we failed to fetch:", zeroWithCount);

  // Of the fetch-failures, how many attempts have they had
  const buckets = await prisma.vehicle.groupBy({
    by: ["photoCacheAttempts"],
    where: { ...base, photoCount: { gt: 0 } },
    _count: true,
    orderBy: { photoCacheAttempts: "asc" },
  });
  console.log("\nFetch-failures by attempt count:");
  for (const b of buckets) {
    console.log(`  ${b.photoCacheAttempts} attempts: ${b._count}`);
  }

  // Sample a few fetch-failures to eyeball
  const sample = await prisma.vehicle.findMany({
    where: { ...base, photoCount: { gt: 0 } },
    take: 5,
    select: { vin: true, photoCount: true, photoCacheAttempts: true, year: true, make: true, model: true },
  });
  console.log("\nSample fetch-failures:");
  console.log(JSON.stringify(sample, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
