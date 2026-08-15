import { env } from "../config/env";
import { fetchWithRetry, HttpError } from "../lib/http";

const YELP_BASE = "https://api.yelp.com/v3";

export interface YelpMatch {
  businessId: string;
  name: string;
  rating: number | null;
  reviewCount: number | null;
}

/**
 * Yelp's trial/paid plans cap requests per day (300-500 on trial) — distinct
 * from a transient per-second rate limit, this won't recover until the next
 * day, so callers should stop the whole run immediately instead of burning
 * through hundreds of dealers on guaranteed failures.
 */
export class YelpQuotaExceededError extends HttpError {
  constructor(message: string) {
    super(message, 429);
    this.name = "YelpQuotaExceededError";
  }
}

export function isYelpConfigured(): boolean {
  return Boolean(env.yelpApiKey);
}

/**
 * Business Search — https://docs.developer.yelp.com/reference/v3_business_search
 * Yelp's search response already includes rating + review_count per result,
 * so unlike Google Places this needs only one call per dealer, not a
 * search-then-details pair.
 */
export async function searchYelpBusiness(
  name: string,
  city: string,
  state: string
): Promise<YelpMatch | null> {
  if (!env.yelpApiKey) return null;

  const params = new URLSearchParams({
    term: name,
    location: `${city}, ${state}`,
    limit: "1",
  });

  const response = await fetchWithRetry(
    `${YELP_BASE}/businesses/search?${params.toString()}`,
    { headers: { Authorization: `Bearer ${env.yelpApiKey}` } }
  );

  if (!response.ok) {
    const body = await response.text();
    if (response.status === 429) {
      throw new YelpQuotaExceededError(
        `Yelp API quota exhausted: ${body.slice(0, 300)}`
      );
    }
    throw new HttpError(
      `Yelp business search failed (${response.status}): ${body.slice(0, 300)}`,
      response.status
    );
  }

  const payload = (await response.json()) as {
    businesses?: {
      id?: string;
      name?: string;
      rating?: number;
      review_count?: number;
    }[];
  };
  const match = payload.businesses?.[0];
  if (!match?.id) return null;

  return {
    businessId: match.id,
    name: match.name ?? "",
    rating: match.rating ?? null,
    reviewCount: match.review_count ?? null,
  };
}

export interface YelpBusinessRating {
  rating: number | null;
  reviewCount: number | null;
  /** false when Yelp confirms this business id does not resolve to a business. */
  valid: boolean;
}

/** Business Details — https://docs.developer.yelp.com/reference/v3_business_info */
export async function fetchYelpBusinessRating(
  businessId: string
): Promise<YelpBusinessRating> {
  if (!env.yelpApiKey) {
    return { rating: null, reviewCount: null, valid: true };
  }

  const response = await fetchWithRetry(
    `${YELP_BASE}/businesses/${encodeURIComponent(businessId)}`,
    { headers: { Authorization: `Bearer ${env.yelpApiKey}` } }
  );

  if (response.status === 404) {
    return { rating: null, reviewCount: null, valid: false };
  }
  if (!response.ok) {
    const body = await response.text();
    if (response.status === 429) {
      throw new YelpQuotaExceededError(
        `Yelp API quota exhausted: ${body.slice(0, 300)}`
      );
    }
    throw new HttpError(
      `Yelp business details failed (${response.status}): ${body.slice(0, 300)}`,
      response.status
    );
  }

  const payload = (await response.json()) as {
    id?: string;
    rating?: number;
    review_count?: number;
  };

  return {
    rating: payload.rating ?? null,
    reviewCount: payload.review_count ?? null,
    valid: Boolean(payload.id),
  };
}
