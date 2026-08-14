import { prisma } from "../lib/prisma";
import { AUTODEV, VEHICLE_SOURCE } from "../config/constants";
import {
  fetchDealerListings,
  isAutoDevConfigured,
  listingPhotoCount,
  resolveBergenDealerId,
  type AutoDevListing,
} from "./autodev.client";
import {
  cacheListingPhotos,
  photosAreCached,
  publicPhotoUrls,
} from "./photo-cache.service";

export interface InventorySyncResult {
  added: number;
  updated: number;
  removed: number;
  failed: number;
  message: string;
  dealerId: string | null;
}

function featuresFrom(listing: AutoDevListing): string[] {
  const raw = listing.retailListing?.features;
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);
  if (typeof raw === "string") {
    return raw
      .split(/[,;|]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function listingCondition(listing: AutoDevListing): string | null {
  if (listing.retailListing?.cpo) return "CPO";
  if (listing.retailListing?.used === false) return "NEW";
  if (listing.retailListing?.used === true) return "USED";
  const value = listing.vehicle?.condition?.toLowerCase() ?? "";
  if (!value) return null;
  if (value.includes("new") && !value.includes("used")) return "NEW";
  if (value.includes("certified") || value.includes("cpo")) return "CPO";
  return "USED";
}

function asText(value: unknown): string | null {
  if (value == null) return null;
  const text = String(value).trim();
  return text || null;
}

function listingVin(listing: AutoDevListing): string | null {
  const vin = asText(listing.vehicle?.vin ?? listing.vin)?.toUpperCase();
  return vin && vin.length >= 8 ? vin : null;
}

function listingPayload(listing: AutoDevListing) {
  const vehicle = listing.vehicle ?? {};
  return {
    year: Number(vehicle.year) || new Date().getFullYear(),
    make: asText(vehicle.make) || "Unknown",
    model: asText(vehicle.model) || "Unknown",
    trim: asText(vehicle.trim),
    mileage:
      vehicle.mileage == null
        ? listing.retailListing?.miles == null
          ? null
          : Number(listing.retailListing.miles)
        : Number(vehicle.mileage),
    bodyStyle: asText(vehicle.bodyStyle),
    fuelType: asText(vehicle.fuel) || asText(vehicle.fuelType),
    transmission: asText(vehicle.transmission),
    exteriorColor: asText(vehicle.exteriorColor),
    interiorColor: asText(vehicle.interiorColor),
    condition: listingCondition(listing),
    price:
      listing.retailListing?.price == null
        ? null
        : Number(listing.retailListing.price),
    description: asText(listing.retailListing?.description),
    features: featuresFrom(listing),
    autoDevListingId: listing.id ? String(listing.id) : listing.vin ?? null,
    source: VEHICLE_SOURCE.autodev,
    isActive: true,
  };
}

async function writeRun(
  startedAt: Date,
  result: InventorySyncResult
): Promise<void> {
  await prisma.syncRun.create({
    data: {
      job: "inventory",
      startedAt,
      finishedAt: new Date(),
      added: result.added,
      updated: result.updated,
      removed: result.removed,
      failed: result.failed,
      message: result.message,
    },
  });
}

export async function syncBergenInventory(): Promise<InventorySyncResult> {
  const startedAt = new Date();
  const result: InventorySyncResult = {
    added: 0,
    updated: 0,
    removed: 0,
    failed: 0,
    message: "",
    dealerId: null,
  };

  const dealer = await prisma.dealer.findUnique({
    where: { slug: AUTODEV.dealerSlug },
  });

  if (!dealer) {
    result.message = `Auto.dev dealer ${AUTODEV.dealerSlug} is not seeded`;
    await writeRun(startedAt, result);
    return result;
  }

  if (!isAutoDevConfigured()) {
    result.message = "AUTODEV_API_KEY is not set; skipped Auto.dev sync";
    await writeRun(startedAt, result);
    return result;
  }

  let resolvedId: string | null = null;
  try {
    resolvedId = await resolveBergenDealerId(dealer.autoDevDealerId);
  } catch (error) {
    console.error("[inventory-sync] dealer resolution failed", error);
    resolvedId = dealer.autoDevDealerId;
  }

  if (!resolvedId) {
    result.message = "Could not resolve Auto.dev dealerId; no fallback stored";
    await writeRun(startedAt, result);
    return result;
  }

  if (resolvedId !== dealer.autoDevDealerId) {
    await prisma.dealer.update({
      where: { id: dealer.id },
      data: { autoDevDealerId: resolvedId },
    });
  }
  result.dealerId = resolvedId;

  const seenVins = new Set<string>();
  const pendingPhotos: { vin: string; photoCount: number }[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    let batch;
    try {
      batch = await fetchDealerListings({ dealerId: resolvedId, page });
    } catch (error) {
      result.message = `Listings fetch failed on page ${page}: ${
        error instanceof Error ? error.message : String(error)
      }`;
      result.failed += 1;
      await writeRun(startedAt, result);
      return result;
    }

    for (const listing of batch.listings) {
      const vin = listingVin(listing);
      if (!vin) {
        result.failed += 1;
        continue;
      }
      seenVins.add(vin);

      try {
        const existing = await prisma.vehicle.findUnique({ where: { vin } });
        const payload = listingPayload(listing);
        const photos = publicPhotoUrls(existing?.photos ?? []);
        const cachedPhotoCount = photos.length;

        if (!photosAreCached(photos)) {
          pendingPhotos.push({
            vin,
            photoCount: listingPhotoCount(listing),
          });
        }

        if (existing) {
          await prisma.vehicle.update({
            where: { vin },
            data: {
              ...payload,
              dealerId: dealer.id,
              photos,
              cachedPhotoCount,
            },
          });
          result.updated += 1;
        } else {
          await prisma.vehicle.create({
            data: {
              dealerId: dealer.id,
              vin,
              photos,
              cachedPhotoCount,
              ...payload,
            },
          });
          result.added += 1;
        }
      } catch (error) {
        result.failed += 1;
        console.error(`[inventory-sync] failed VIN ${vin}`, error);
      }
    }

    hasMore = batch.hasMore && batch.listings.length > 0;
    page += 1;
    if (page > 100) break;
  }

  if (seenVins.size > 0) {
    const sold = await prisma.vehicle.updateMany({
      where: {
        dealerId: dealer.id,
        source: VEHICLE_SOURCE.autodev,
        isActive: true,
        vin: { notIn: [...seenVins] },
      },
      data: { isActive: false },
    });
    result.removed = sold.count;
  }

  const photoQueue = [...pendingPhotos];
  const photoWorkers = Array.from({ length: Math.min(3, photoQueue.length) }, async () => {
    while (photoQueue.length > 0) {
      const item = photoQueue.shift();
      if (!item) return;
      try {
        const cached = await cacheListingPhotos(item.vin, item.photoCount);
        if (cached.length === 0) continue;
        await prisma.vehicle.update({
          where: { vin: item.vin },
          data: { photos: cached, cachedPhotoCount: cached.length },
        });
      } catch (error) {
        console.error(`[inventory-sync] photos VIN ${item.vin}`, error);
      }
    }
  });
  await Promise.all(photoWorkers);

  result.message = `Synced ${dealer.name} (${resolvedId}): +${result.added} ~${result.updated} -${result.removed} fail ${result.failed}`;
  await writeRun(startedAt, result);
  console.log(`[inventory-sync] ${result.message}`);
  return result;
}
