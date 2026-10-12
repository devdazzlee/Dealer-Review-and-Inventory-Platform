import "dotenv/config";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../lib/prisma";
import { maxPhotosForDealer } from "../services/photo-cache.service";

/**
 * Trims every listing's stored photos down to the per-dealer cap
 * (maxPhotosForDealer): keeps the first N, deletes the rest from disk and
 * from the vehicle row. Written after the photo store filled the VPS disk.
 *
 * Dry run by default; pass --apply to delete.
 *   node dist/scripts/trim-vehicle-photos.js            # report only
 *   node dist/scripts/trim-vehicle-photos.js --apply    # delete
 */

const APPLY = process.argv.includes("--apply");
const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "vehicles");
const PAGE = 1000;
const LOCAL_PHOTO = /^\/uploads\/vehicles\/([A-Za-z0-9]+)\/(\d+\.webp)$/;

async function fileSize(file: string): Promise<number> {
  try {
    return (await fs.stat(file)).size;
  } catch {
    return 0;
  }
}

async function main(): Promise<void> {
  let cursor: string | undefined;
  let vehicles = 0;
  let trimmed = 0;
  let files = 0;
  let bytes = 0;

  for (;;) {
    const page = await prisma.vehicle.findMany({
      where: { cachedPhotoCount: { gt: 0 } },
      select: { id: true, vin: true, photos: true, dealer: { select: { slug: true } } },
      orderBy: { id: "asc" },
      take: PAGE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    });
    if (page.length === 0) break;
    cursor = page[page.length - 1].id;

    for (const vehicle of page) {
      vehicles += 1;
      const cap = maxPhotosForDealer(vehicle.dealer?.slug);
      if (vehicle.photos.length <= cap) continue;

      const keep = vehicle.photos.slice(0, cap);
      const drop = vehicle.photos.slice(cap);
      trimmed += 1;

      for (const url of drop) {
        const match = LOCAL_PHOTO.exec(url);
        // Only our own files under uploads/vehicles/<this VIN>/ are deleted.
        if (!match || match[1] !== vehicle.vin) continue;
        const file = path.join(UPLOAD_ROOT, match[1], match[2]);
        bytes += await fileSize(file);
        files += 1;
        if (APPLY) await fs.rm(file, { force: true });
      }

      if (APPLY) {
        await prisma.vehicle.update({
          where: { id: vehicle.id },
          data: { photos: keep, cachedPhotoCount: keep.length },
        });
      }
    }
    console.log(
      `${vehicles} checked, ${trimmed} over the cap, ${files} photos (${(bytes / 1e9).toFixed(2)} GB)${APPLY ? " deleted" : " would be deleted"}`
    );
  }
  console.log(APPLY ? "Done." : "Dry run. Re-run with --apply to delete.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
