import { env } from "../config/env";
import { AUTODEV } from "../config/constants";
import { fetchWithRetry, HttpError } from "../lib/http";

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
  };
  location?: unknown;
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
