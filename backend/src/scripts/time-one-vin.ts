import { cacheListingPhotos } from "../services/photo-cache.service";
import { prisma } from "../lib/prisma";

async function main() {
  const vin = process.argv[2] ?? "1N4AL4CV5RN327056";
  console.log("Timing cacheListingPhotos for", vin);
  const t0 = Date.now();
  try {
    const urls = await cacheListingPhotos(vin);
    console.log(`Done in ${((Date.now() - t0) / 1000).toFixed(1)}s -> ${urls.length} photos`);
    console.log(urls.slice(0, 3));
  } catch (e) {
    console.log(`FAILED after ${((Date.now() - t0) / 1000).toFixed(1)}s:`, (e as Error).message);
  }
}

main().finally(() => prisma.$disconnect());
