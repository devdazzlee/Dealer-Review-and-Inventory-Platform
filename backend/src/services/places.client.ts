import { env } from "../config/env";
import { fetchWithRetry, HttpError } from "../lib/http";
import { isPlausibleNameMatch } from "../lib/name-match";

export { isPlausibleNameMatch };

const PLACES_BASE = "https://places.googleapis.com/v1";

export interface PlaceRating {
  placeId: string;
  rating: number | null;
  reviewCount: number | null;
  /** false when Places confirms this place_id does not resolve to a business. */
  valid: boolean;
}

export interface PlaceMatch {
  placeId: string;
  name: string;
}

/**
 * Google's daily quota (e.g. 100 SearchTextRequest/project/day on a fresh
 * project) has been exhausted — distinct from a transient per-minute 429,
 * this won't recover until the quota resets, so callers should stop
 * retrying entirely rather than backing off and trying again.
 */
export class QuotaExceededError extends HttpError {
  constructor(message: string) {
    super(message, 429);
    this.name = "QuotaExceededError";
  }
}

export function isPlacesConfigured(): boolean {
  return Boolean(env.googlePlacesApiKey);
}

function authHeaders(fieldMask: string): Record<string, string> {
  return {
    "X-Goog-Api-Key": env.googlePlacesApiKey ?? "",
    "X-Goog-FieldMask": fieldMask,
  };
}

async function throwForFailedResponse(
  response: Response,
  label: string
): Promise<never> {
  const body = await response.text();
  if (response.status === 429 && /PerDay/i.test(body)) {
    throw new QuotaExceededError(`${label} — daily Places API quota exhausted`);
  }
  throw new HttpError(`${label} failed (${response.status})`, response.status);
}

/** Text Search (New) — https://developers.google.com/maps/documentation/places/web-service/text-search */
export async function searchPlace(query: string): Promise<PlaceMatch | null> {
  if (!env.googlePlacesApiKey) return null;

  const response = await fetchWithRetry(`${PLACES_BASE}/places:searchText`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeaders("places.id,places.displayName"),
    },
    body: JSON.stringify({ textQuery: query, pageSize: 1 }),
  });

  if (!response.ok) {
    await throwForFailedResponse(response, "Places Text Search");
  }

  const payload = (await response.json()) as {
    places?: { id?: string; displayName?: { text?: string } }[];
  };
  const match = payload.places?.[0];
  if (!match?.id) return null;

  return { placeId: match.id, name: match.displayName?.text ?? "" };
}

/** Back-compat wrapper — search only, no name returned. */
export async function findPlaceId(query: string): Promise<string | null> {
  const match = await searchPlace(query);
  return match?.placeId ?? null;
}

/** Place Details (New) — https://developers.google.com/maps/documentation/places/web-service/place-details */
export async function fetchPlaceRating(placeId: string): Promise<PlaceRating> {
  if (!env.googlePlacesApiKey) {
    return { placeId, rating: null, reviewCount: null, valid: true };
  }

  const response = await fetchWithRetry(`${PLACES_BASE}/places/${placeId}`, {
    headers: authHeaders("id,rating,userRatingCount"),
  });

  if (response.status === 404) {
    return { placeId, rating: null, reviewCount: null, valid: false };
  }
  if (!response.ok) {
    await throwForFailedResponse(response, "Places Details");
  }

  const payload = (await response.json()) as {
    id?: string;
    rating?: number;
    userRatingCount?: number;
  };

  return {
    placeId,
    rating: payload.rating ?? null,
    reviewCount: payload.userRatingCount ?? null,
    valid: Boolean(payload.id),
  };
}
