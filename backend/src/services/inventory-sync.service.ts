import { Dealer } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { AUTODEV, VEHICLE_SOURCE } from "../config/constants";
import {
  fetchDealerListings,
  isAutoDevConfigured,
  listingPhotoCount,
  resolveBergenDealerId,
  AutoDevQuotaExceededError,
  type AutoDevListing,
} from "./autodev.client";
import {
  cacheListingPhotos,
  photosAreCached,
  publicPhotoUrls,
} from "./photo-cache.service";
import { dealerRepository } from "../repositories/dealer.repository";
import { withTimeout } from "../lib/http";

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

interface PendingPhotoItem {
  vin: string;
  photoCount: number;
}

/**
 * Syncs one dealer's live vehicle *data* from Auto.dev — no photo downloads.
 * Fast by design: this is what lets every dealer in a fleet sync get real
 * vehicle counts and specs quickly, instead of dealer #2 waiting on dealer
 * #1's photo downloads to finish first. Photo work is returned as a queue
 * for the caller to process (inline for a single-dealer sync, or handed off
 * to the standalone photo-catchup job for a fleet sync).
 */
async function syncDealerListings(
  dealer: Dealer,
  startedAt: Date
): Promise<{ result: InventorySyncResult; pendingPhotos: PendingPhotoItem[] }> {
  const result: InventorySyncResult = {
    added: 0,
    updated: 0,
    removed: 0,
    failed: 0,
    message: "",
    dealerId: dealer.autoDevDealerId,
  };

  const resolvedId = dealer.autoDevDealerId;
  if (!resolvedId) {
    result.message = `${dealer.name} has no autoDevDealerId`;
    await writeRun(startedAt, result);
    return { result, pendingPhotos: [] };
  }

  const seenVins = new Set<string>();
  const pendingPhotos: PendingPhotoItem[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    let batch;
    try {
      batch = await fetchDealerListings({ dealerId: resolvedId, page });
    } catch (error) {
      // Quota exhaustion isn't this dealer's problem to swallow — every
      // other dealer in the fleet loop would fail the same way, so the
      // caller needs to see this and stop, not just mark one dealer failed.
      if (error instanceof AutoDevQuotaExceededError) {
        throw error;
      }
      result.message = `Listings fetch failed on page ${page}: ${
        error instanceof Error ? error.message : String(error)
      }`;
      result.failed += 1;
      await writeRun(startedAt, result);
      return { result, pendingPhotos };
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
        const reportedPhotoCount = listingPhotoCount(listing);
        // Railway's disk is ephemeral — once Cloudinary is configured, migrate
        // any photos still sitting on local /uploads storage off of it.
        const needsCloudinaryMigration =
          Boolean(env.cloudinaryUrl) &&
          photos.some((url) => !url.includes("res.cloudinary.com"));

        if (
          !photosAreCached(photos) ||
          cachedPhotoCount < reportedPhotoCount ||
          needsCloudinaryMigration
        ) {
          pendingPhotos.push({
            vin,
            photoCount: reportedPhotoCount,
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

  result.message = `Synced ${dealer.name} (${resolvedId}) listings: +${result.added} ~${result.updated} -${result.removed} fail ${result.failed}, ${pendingPhotos.length} pending photos`;
  console.log(`[inventory-sync] ${result.message}`);
  return { result, pendingPhotos };
}

/** Processes a queue of pending photo downloads with bounded concurrency. */
async function cachePhotoQueue(items: PendingPhotoItem[]): Promise<void> {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(3, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
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
  await Promise.all(workers);
}

/**
 * Syncs one dealer's live inventory + photos from Auto.dev. `dealer` must
 * already carry a confirmed `autoDevDealerId` (set at discovery time, or
 * re-resolved for Bergen by `syncBergenInventory`). Used for single-dealer
 * syncs (Bergen, manual re-sync) where waiting for photos is acceptable —
 * the fleet sync uses `syncDealerListings` directly and defers photo work
 * to the standalone photo-catchup job instead.
 */
export async function syncDealerInventory(
  dealer: Dealer
): Promise<InventorySyncResult> {
  const startedAt = new Date();
  const { result, pendingPhotos } = await syncDealerListings(dealer, startedAt);
  if (pendingPhotos.length > 0) {
    await cachePhotoQueue(pendingPhotos);
  }
  result.message = `Synced ${dealer.name}: +${result.added} ~${result.updated} -${result.removed} fail ${result.failed}`;
  await writeRun(startedAt, result);
  console.log(`[inventory-sync] ${result.message}`);
  return result;
}

/**
 * Bergen Car is the one dealer whose autoDevDealerId isn't trusted as fixed —
 * re-resolve it by name every run (IDs can change), keeping the last known
 * good id as a fallback if resolution fails.
 */
export async function syncBergenInventory(): Promise<InventorySyncResult> {
  const startedAt = new Date();
  const emptyResult: InventorySyncResult = {
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
    emptyResult.message = `Auto.dev dealer ${AUTODEV.dealerSlug} is not seeded`;
    await writeRun(startedAt, emptyResult);
    return emptyResult;
  }

  if (!isAutoDevConfigured()) {
    emptyResult.message = "AUTODEV_API_KEY is not set; skipped Auto.dev sync";
    await writeRun(startedAt, emptyResult);
    return emptyResult;
  }

  let resolvedId: string | null = null;
  try {
    resolvedId = await resolveBergenDealerId(dealer.autoDevDealerId);
  } catch (error) {
    console.error("[inventory-sync] dealer resolution failed", error);
    resolvedId = dealer.autoDevDealerId;
  }

  if (!resolvedId) {
    emptyResult.message = "Could not resolve Auto.dev dealerId; no fallback stored";
    await writeRun(startedAt, emptyResult);
    return emptyResult;
  }

  const updated =
    resolvedId !== dealer.autoDevDealerId
      ? await prisma.dealer.update({
          where: { id: dealer.id },
          data: { autoDevDealerId: resolvedId },
        })
      : dealer;

  return syncDealerInventory(updated);
}

export interface FleetSyncResult {
  dealersSynced: number;
  added: number;
  updated: number;
  removed: number;
  failed: number;
  quotaExhausted: boolean;
  message: string;
}

/**
 * Syncs every autodev-sourced dealer: Bergen (with name re-resolution) plus
 * any dealer onboarded through nationwide discovery. Intended for the daily
 * cron — dealer-by-dealer photo caching is the slow part, so this naturally
 * spreads across cron runs rather than blocking on one HTTP request.
 */
export async function syncAllAutoDevDealers(): Promise<FleetSyncResult> {
  const fleetStartedAt = new Date();
  const summary: FleetSyncResult = {
    dealersSynced: 0,
    added: 0,
    updated: 0,
    removed: 0,
    failed: 0,
    quotaExhausted: false,
    message: "",
  };

  try {
    const bergen = await syncBergenInventory();
    summary.dealersSynced += 1;
    summary.added += bergen.added;
    summary.updated += bergen.updated;
    summary.removed += bergen.removed;
    summary.failed += bergen.failed;
  } catch (error) {
    if (error instanceof AutoDevQuotaExceededError) {
      summary.quotaExhausted = true;
      summary.message = `Fleet sync: Auto.dev monthly quota exhausted before any dealer synced. Resumes when quota resets or plan is upgraded.`;
      await prisma.syncRun.create({
        data: {
          job: "inventory-fleet",
          startedAt: fleetStartedAt,
          finishedAt: new Date(),
          message: summary.message,
        },
      });
      console.warn(`[inventory-sync] ${summary.message}`);
      return summary;
    }
    throw error;
  }

  const others = (await dealerRepository.findAllAutoDevSourced()).filter(
    (d) => d.slug !== AUTODEV.dealerSlug && d.autoDevDealerId
  );

  // Listings only, deliberately — waiting for every dealer's photos before
  // moving to the next one is what made fleet syncs impossibly slow at scale
  // (see cachePendingVehiclePhotos for the separate job that catches those up).
  for (const dealer of others) {
    try {
      // A stuck Neon connection or hung Auto.dev call on one dealer shouldn't
      // be able to block the other 1000+ dealers for hours — same failure
      // mode that made dealer-discovery hang overnight.
      const { result } = await withTimeout(
        syncDealerListings(dealer, new Date()),
        60_000,
        `dealer ${dealer.name}`
      );
      summary.dealersSynced += 1;
      summary.added += result.added;
      summary.updated += result.updated;
      summary.removed += result.removed;
      summary.failed += result.failed;
    } catch (error) {
      if (error instanceof AutoDevQuotaExceededError) {
        // Monthly cap, not transient — every remaining dealer would fail
        // the same way. Stop now instead of burning through the rest.
        summary.quotaExhausted = true;
        console.warn(
          `[inventory-sync] Auto.dev monthly quota exhausted after ${summary.dealersSynced} dealers — stopping`
        );
        break;
      }
      summary.dealersSynced += 1;
      summary.failed += 1;
      console.error(`[inventory-sync] ${dealer.name} failed or timed out`, error);
    }
  }

  summary.message = summary.quotaExhausted
    ? `Fleet sync: Auto.dev monthly quota exhausted after ${summary.dealersSynced}/${others.length + 1} dealers. +${summary.added} ~${summary.updated} -${summary.removed} fail ${summary.failed}. Resumes when quota resets or plan is upgraded.`
    : `Fleet sync: ${summary.dealersSynced} dealers, +${summary.added} ~${summary.updated} -${summary.removed} fail ${summary.failed} (photos handled separately)`;
  await prisma.syncRun.create({
    data: {
      job: "inventory-fleet",
      startedAt: fleetStartedAt,
      finishedAt: new Date(),
      added: summary.added,
      updated: summary.updated,
      removed: summary.removed,
      failed: summary.failed,
      message: summary.message,
    },
  });
  console.log(`[inventory-sync] ${summary.message}`);
  return summary;
}

export interface PhotoCatchupResult {
  candidates: number;
  cached: number;
  failed: number;
  message: string;
}

/**
 * Fleet-wide photo backlog, run as its own job so it never blocks vehicle
 * data from appearing. Picks up any active autodev vehicle with zero cached
 * photos — covers the common case (a dealer just synced for the first time)
 * without needing Auto.dev's per-listing photo count, which isn't persisted.
 * Bounded per run (`limit`) so each invocation stays a reasonable length;
 * scheduled to run repeatedly until the whole backlog is cleared.
 */
export async function cachePendingVehiclePhotos(
  limit = 100
): Promise<PhotoCatchupResult> {
  const startedAt = new Date();
  const vehicles = await prisma.vehicle.findMany({
    where: {
      source: VEHICLE_SOURCE.autodev,
      isActive: true,
      cachedPhotoCount: 0,
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
    select: { vin: true },
  });

  let cached = 0;
  let failed = 0;
  const queue = [...vehicles];
  const workers = Array.from({ length: Math.min(5, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) return;
      try {
        const urls = await withTimeout(
          cacheListingPhotos(item.vin),
          60_000,
          `VIN ${item.vin}`
        );
        if (urls.length === 0) continue;
        await prisma.vehicle.update({
          where: { vin: item.vin },
          data: { photos: urls, cachedPhotoCount: urls.length },
        });
        cached += 1;
      } catch (error) {
        failed += 1;
        console.error(`[photo-catchup] VIN ${item.vin}`, error);
      }
    }
  });
  await Promise.all(workers);

  const result: PhotoCatchupResult = {
    candidates: vehicles.length,
    cached,
    failed,
    message: `Photo catch-up: ${cached}/${vehicles.length} vehicles cached, ${failed} failed`,
  };
  await prisma.syncRun.create({
    data: {
      job: "photo-catchup",
      startedAt,
      finishedAt: new Date(),
      updated: cached,
      failed,
      message: result.message,
    },
  });
  console.log(`[inventory-sync] ${result.message}`);
  return result;
}
