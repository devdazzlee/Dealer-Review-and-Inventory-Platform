import { prisma } from "../lib/prisma";

async function main() {
  const withPhotos = await prisma.vehicle.findMany({
    where: { source: "autodev", isActive: true, cachedPhotoCount: { gt: 0 } },
    select: { vin: true, photos: true, photoCacheCheckedAt: true },
    orderBy: { photoCacheCheckedAt: "desc" },
    take: 2000,
  });

  let cloudinary = 0;
  let local = 0;
  let other = 0;
  for (const v of withPhotos) {
    const first = v.photos[0] ?? "";
    if (first.includes("res.cloudinary.com")) cloudinary += 1;
    else if (first.startsWith("/uploads/")) local += 1;
    else other += 1;
  }

  console.log(`Sampled ${withPhotos.length} most-recently-cached vehicles:`);
  console.log("  Cloudinary URLs:", cloudinary);
  console.log("  Local /uploads/ paths:", local);
  console.log("  Other:", other);
  console.log("\nExamples:");
  console.log(withPhotos.slice(0, 5).map((v) => ({ vin: v.vin, first: v.photos[0] })));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
