import { env } from "../config/env";
import { AUTODEV } from "../config/constants";
import { fetchWithRetry, HttpError } from "../lib/http";

/**
 * Auto.dev's free tier caps at 1000 requests *per month*, not per day — once
 * hit, every request fails with 429 until the next billing cycle (or an
 * upgrade). Distinct from a transient rate limit: retrying does nothing,
 * so callers should stop the whole run immediately instead of burning
 * through hundreds of dealers/regions on guaranteed failures.
 */
export class AutoDevQuotaExceededError extends HttpError {
  constructor(message: string) {
    super(message, 429);
    this.name = "AutoDevQuotaExceededError";
  }
}

export interface AutoDevListing {
  id?: string;
  vin?: string;
  updatedAt?: string;
  vehicle?: {
    vin?: string;
    year?: number;
    make?: string;
    model?: string;
    trim?: string;
    mileage?: number;
    bodyStyle?: string;
    fuel?: string;
    fuelType?: string;
    transmission?: string;
    exteriorColor?: string;
    interiorColor?: string;
    condition?: string;
  };
  retailListing?: {
    price?: number;
    description?: string;
    features?: string[] | string;
    miles?: number;
    dealer?: string;
    dealerId?: string | number;
    used?: boolean;
    cpo?: boolean;
    primaryImage?: string;
    photoCount?: number;
    city?: string;
    state?: string;
    zip?: string;
    /** Vehicle detail page on the dealer's own site — its origin doubles as the dealer website. */
    vdp?: string;
  };
  /** [longitude, latitude] — Auto.dev provides no street-level address. */
  location?: [number, number];
}

export interface DiscoveredDealer {
  autoDevDealerId: string;
  name: string;
  city: string;
  state: string;
  zip: string;
  website: string | null;
}

interface ListingsResponse {
  data?: unknown[];
  listings?: unknown[];
  results?: unknown[];
  total?: number;
  links?: { next?: string };
  error?: { status?: number; error?: string; code?: string };
}

function requireApiKey(): string {
  if (!env.autoDevApiKey) {
    throw new Error("AUTODEV_API_KEY is not configured");
  }
  return env.autoDevApiKey;
}

function nestListing(row: Record<string, unknown>): AutoDevListing {
  if (row.vehicle && typeof row.vehicle === "object") {
    return row as AutoDevListing;
  }

  const vehicle: NonNullable<AutoDevListing["vehicle"]> = {};
  const retailListing: NonNullable<AutoDevListing["retailListing"]> = {};
  const nested: AutoDevListing = { vehicle, retailListing };

  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith("vehicle.")) {
      (vehicle as Record<string, unknown>)[key.slice("vehicle.".length)] = value;
    } else if (key.startsWith("retailListing.")) {
      (retailListing as Record<string, unknown>)[key.slice("retailListing.".length)] =
        value;
    } else {
      (nested as Record<string, unknown>)[key] = value;
    }
  }

  return nested;
}

function listingArray(payload: ListingsResponse): AutoDevListing[] {
  const rows = payload.data ?? payload.listings ?? payload.results ?? [];
  return rows
    .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
    .map(nestListing);
}

export function listingDealerName(listing: AutoDevListing): string {
  return listing.retailListing?.dealer?.trim() || "";
}

export function listingDealerId(listing: AutoDevListing): string | null {
  const raw = listing.retailListing?.dealerId;
  return raw == null || raw === "" ? null : String(raw);
}

export function listingPhotoCount(listing: AutoDevListing): number {
  const count = listing.retailListing?.photoCount;
  return typeof count === "number" && count > 0 ? count : 0;
}

export function isBergenCarName(name: string): boolean {
  const normalized = name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return normalized.includes(AUTODEV.dealerNameMatch);
}

async function getListings(url: string): Promise<ListingsResponse> {
  const response = await fetchWithRetry(url, {
    headers: {
      Authorization: `Bearer ${requireApiKey()}`,
      Accept: "application/json",
    },
  });

  const body = await response.text();
  let payload: ListingsResponse = {};
  try {
    payload = body ? (JSON.parse(body) as ListingsResponse) : {};
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const detail =
      payload.error?.error || body.slice(0, 400) || `HTTP ${response.status}`;
    if (
      response.status === 429 &&
      (payload.error?.code === "RATE_LIMIT_EXCEEDED" || /monthly quota/i.test(detail))
    ) {
      throw new AutoDevQuotaExceededError(`Auto.dev monthly quota exhausted: ${detail}`);
    }
    throw new HttpError(`Auto.dev listings failed (${response.status}): ${detail}`, response.status);
  }

  return payload;
}

function listingsUrl(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  return `${AUTODEV.baseUrl}/listings?${search.toString()}`;
}

export async function searchListingsNearZip(options: {
  zip: string;
  distance: number;
  page?: number;
  dealerNameContains?: string;
}): Promise<{ listings: AutoDevListing[]; hasMore: boolean; nextUrl: string | null }> {
  const params: Record<string, string | number | undefined> = {
    zip: options.zip,
    distance: options.distance,
    page: options.page ?? 1,
    limit: AUTODEV.pageSize,
  };
  if (options.dealerNameContains) {
    params["retailListing.dealer"] = `*${options.dealerNameContains}*`;
  }
  return fetchListingsPage(listingsUrl(params));
}

export async function fetchDealerListings(options: {
  dealerId: string;
  page: number;
}): Promise<{ listings: AutoDevListing[]; hasMore: boolean; nextUrl: string | null }> {
  return fetchListingsPage(
    listingsUrl({
      dealerId: options.dealerId,
      page: options.page,
      limit: AUTODEV.pageSize,
    })
  );
}

async function fetchListingsPage(url: string): Promise<{
  listings: AutoDevListing[];
  hasMore: boolean;
  nextUrl: string | null;
}> {
  const payload = await getListings(url);
  const listings = listingArray(payload);
  const nextUrl = payload.links?.next?.trim() || null;
  return {
    listings,
    hasMore: Boolean(nextUrl) && listings.length > 0,
    nextUrl,
  };
}

export async function resolveBergenDealerId(
  fallback: string | null
): Promise<string | null> {
  const batch = await searchListingsNearZip({
    zip: AUTODEV.zip,
    distance: AUTODEV.distanceMiles,
    page: 1,
    dealerNameContains: "Bergen Car",
  });

  const match = batch.listings.find((listing) =>
    isBergenCarName(listingDealerName(listing))
  );
  if (!match) return fallback;
  return listingDealerId(match) ?? fallback;
}

export function isAutoDevConfigured(): boolean {
  return Boolean(env.autoDevApiKey);
}

function websiteFromVdp(vdp: string | undefined): string | null {
  if (!vdp) return null;
  try {
    return new URL(vdp).origin;
  } catch {
    return null;
  }
}

/**
 * Walks listings near a zip and returns the unique real dealers found in the
 * results (by Auto.dev dealerId). Used for nationwide dealer discovery —
 * distinct from resolveBergenDealerId, which targets one known dealer.
 */
export async function discoverDealersNearZip(options: {
  zip: string;
  distance: number;
  maxPages: number;
}): Promise<DiscoveredDealer[]> {
  const found = new Map<string, DiscoveredDealer>();
  let page = 1;
  let hasMore = true;

  while (hasMore && page <= options.maxPages) {
    const batch = await searchListingsNearZip({
      zip: options.zip,
      distance: options.distance,
      page,
    });

    for (const listing of batch.listings) {
      const dealerId = listingDealerId(listing);
      const name = listingDealerName(listing);
      const city = listing.retailListing?.city?.trim();
      const state = listing.retailListing?.state?.trim();
      const zip = listing.retailListing?.zip?.trim();
      if (!dealerId || !name || !city || !state || !zip) continue;
      if (found.has(dealerId)) continue;

      found.set(dealerId, {
        autoDevDealerId: dealerId,
        name,
        city,
        state,
        zip,
        website: websiteFromVdp(listing.retailListing?.vdp),
      });
    }

    hasMore = batch.hasMore;
    page += 1;
  }

  return [...found.values()];
}
