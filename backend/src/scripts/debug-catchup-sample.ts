import "dotenv/config";
import { prisma } from "../lib/prisma";
import { cacheListingPhotos } from "../services/photo-cache.service";

async function main() {
  const vins = await prisma.vehicle.findMany({
    where: {
      source: "autodev",
      isActive: true,
      cachedPhotoCount: 0,
      photoCacheCheckedAt: null,
    },
    take: 10,
    select: { vin: true, year: true, make: true, model: true },
  });

  for (const v of vins) {
    const t0 = Date.now();
    try {
      const urls = await cacheListingPhotos(v.vin);
      console.log(
        `${v.vin} ${v.year} ${v.make} ${v.model} -> ${urls.length} photos in ${((Date.now() - t0) / 1000).toFixed(1)}s  ${urls[0] ?? ""}`
      );
    } catch (e) {
      console.log(
        `${v.vin} ${v.year} ${v.make} ${v.model} -> ERROR ${(e as Error).message} in ${((Date.now() - t0) / 1000).toFixed(1)}s`
      );
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
