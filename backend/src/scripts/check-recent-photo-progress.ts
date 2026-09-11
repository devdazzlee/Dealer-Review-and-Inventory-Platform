import { prisma } from "../lib/prisma";

async function main() {
  const since = new Date(Date.now() - 20 * 60 * 1000);
  const recent = await prisma.vehicle.findMany({
    where: {
      source: "autodev",
      isActive: true,
      photoCacheCheckedAt: { gte: since },
    },
    select: { cachedPhotoCount: true, photoCacheAttempts: true },
  });

  const withPhotos = recent.filter((v) => v.cachedPhotoCount > 0).length;
  const without = recent.length - withPhotos;

  console.log(`Vehicles checked in last 20 min: ${recent.length}`);
  console.log(`  got photos: ${withPhotos}`);
  console.log(`  still zero: ${without}`);
  console.log(
    `  hit rate: ${recent.length ? ((withPhotos / recent.length) * 100).toFixed(0) : 0}%`
  );

  const totalCached = await prisma.vehicle.count({
    where: { source: "autodev", isActive: true, cachedPhotoCount: { gt: 0 } },
  });
  const neverChecked = await prisma.vehicle.count({
    where: {
      source: "autodev",
      isActive: true,
      cachedPhotoCount: 0,
      photoCacheCheckedAt: null,
    },
  });
  console.log(`\nTotal with photos: ${totalCached}`);
  console.log(`Never checked: ${neverChecked}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
