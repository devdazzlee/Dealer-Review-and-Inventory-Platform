import type { DealerRatings } from "@/types/vehicle";
import type { DealerSummary } from "@/types/dealer";
import {
  DEMO_DEALERS,
  getVehiclesByDealerSlug,
} from "@/lib/vehicles/data";

export interface DealerCardData {
  name: string;
  slug: string;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  featured: boolean;
  ratings: DealerRatings;
  vehicleCount: number;
  hasBadge?: boolean;
  badgeYear?: number | null;
}

/** Map API dealer payload to the shared DealerRatings shape used across UI. */
export function ratingsFromDealerApi(dealer: DealerSummary): DealerRatings {
  return {
    google: dealer.googleRating,
    googleCount: dealer.googleReviewCount ?? 0,
    yelp: dealer.yelpRating,
    yelpCount: dealer.yelpReviewCount ?? 0,
    carfax: dealer.carfaxRating,
    autoSalesReviews: dealer.autoSalesReviewsRating,
    platform: dealer.platformRating,
    platformCount: dealer.platformReviewCount ?? 0,
    combined: dealer.combinedRating,
    totalReviews: dealer.totalReviews,
    sources: dealer.ratingSources,
  };
}

/**
 * Legacy inventory dealers only expose google/yelp/carfax.
 * Normalize to the full DealerRatings shape without inventing extra sources.
 */
export function normalizeInventoryRatings(
  ratings: Partial<DealerRatings> | DealerRatings
): DealerRatings {
  const google = ratings.google ?? null;
  const yelp = ratings.yelp ?? null;
  const carfax = ratings.carfax ?? null;
  const values = [google, yelp, carfax].filter(
    (v): v is number => v != null && Number.isFinite(v)
  );
  const combined =
    ratings.combined ??
    (values.length > 0
      ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      : null);

  return {
    google,
    googleCount: ratings.googleCount ?? 0,
    yelp,
    yelpCount: ratings.yelpCount ?? 0,
    carfax,
    autoSalesReviews: ratings.autoSalesReviews ?? null,
    platform: ratings.platform ?? null,
    platformCount: ratings.platformCount ?? 0,
    combined,
    totalReviews: ratings.totalReviews ?? 0,
    sources: ratings.sources,
  };
}

export function getVehicleCountForSlug(slug: string): number {
  const real = getVehiclesByDealerSlug(slug).length;
  if (real > 0) return real;
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return 8 + (h % 40);
}

export function enrichDealerSummary(dealer: DealerSummary): DealerCardData {
  return {
    name: dealer.name,
    slug: dealer.slug,
    city: dealer.city,
    state: dealer.state,
    phone: dealer.phone,
    website: dealer.website,
    featured: dealer.featured,
    ratings: ratingsFromDealerApi(dealer),
    vehicleCount: getVehicleCountForSlug(dealer.slug),
    hasBadge: dealer.hasBadge,
    badgeYear: dealer.badgeYear,
  };
}

export interface DealerLocationHint {
  city?: string;
  stateCode?: string;
}

/** Homepage: prefer API-enriched list; fall back to inventory dealers. */
export function getTopRatedDemoDealers(
  limit = 3,
  location?: DealerLocationHint
): DealerCardData[] {
  const ranked = Object.values(DEMO_DEALERS)
    .map((d) => ({
      name: d.name,
      slug: d.slug,
      city: d.city,
      state: d.state,
      phone: d.phone,
      website: null,
      featured: d.featured,
      ratings: normalizeInventoryRatings(d.ratings),
      vehicleCount: getVehiclesByDealerSlug(d.slug).length,
    }))
    .sort((a, b) => {
      if (a.slug === "bergen-car" && b.slug !== "bergen-car") return -1;
      if (b.slug === "bergen-car" && a.slug !== "bergen-car") return 1;
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return (b.ratings.combined ?? 0) - (a.ratings.combined ?? 0);
    });

  if (!location?.city && !location?.stateCode) {
    return ranked.slice(0, limit);
  }

  const local = ranked.filter((d) =>
    location.city
      ? d.city.toLowerCase() === location.city.toLowerCase()
      : d.state.toUpperCase() === location.stateCode!.toUpperCase()
  );

  if (local.length === 0) {
    return ranked.slice(0, limit);
  }

  const localSlugs = new Set(local.map((d) => d.slug));
  const rest = ranked.filter((d) => !localSlugs.has(d.slug));
  return [...local, ...rest].slice(0, limit);
}
