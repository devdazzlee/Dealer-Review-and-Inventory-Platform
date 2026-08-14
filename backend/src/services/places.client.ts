import { env } from "../config/env";
import { fetchWithRetry, HttpError } from "../lib/http";

const PLACES_BASE = "https://maps.googleapis.com/maps/api/place";

export interface PlaceRating {
  placeId: string;
  rating: number | null;
  reviewCount: number | null;
}

export function isPlacesConfigured(): boolean {
  return Boolean(env.googlePlacesApiKey);
}

export async function findPlaceId(query: string): Promise<string | null> {
  if (!env.googlePlacesApiKey) return null;

  const params = new URLSearchParams({
    input: query,
    inputtype: "textquery",
    fields: "place_id,name",
    key: env.googlePlacesApiKey,
  });
  const response = await fetchWithRetry(
    `${PLACES_BASE}/findplacefromtext/json?${params.toString()}`
  );
  if (!response.ok) {
    throw new HttpError(`Places Find failed (${response.status})`, response.status);
  }
  const payload = (await response.json()) as {
    candidates?: { place_id?: string }[];
  };
  return payload.candidates?.[0]?.place_id ?? null;
}

export async function fetchPlaceRating(placeId: string): Promise<PlaceRating> {
  if (!env.googlePlacesApiKey) {
    return { placeId, rating: null, reviewCount: null };
  }

  const params = new URLSearchParams({
    place_id: placeId,
    fields: "rating,user_ratings_total",
    key: env.googlePlacesApiKey,
  });
  const response = await fetchWithRetry(
    `${PLACES_BASE}/details/json?${params.toString()}`
  );
  if (!response.ok) {
    throw new HttpError(`Places Details failed (${response.status})`, response.status);
  }
  const payload = (await response.json()) as {
    result?: { rating?: number; user_ratings_total?: number };
  };
  return {
    placeId,
    rating: payload.result?.rating ?? null,
    reviewCount: payload.result?.user_ratings_total ?? null,
  };
}
