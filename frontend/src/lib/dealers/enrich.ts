import type { DealerRatings } from "@/types/vehicle";
import type { DealerSummary } from "@/types/dealer";

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
    vehicleCount: dealer.vehicleCount ?? 0,
    hasBadge: dealer.hasBadge,
    badgeYear: dealer.badgeYear,
  };
}

export function sortDealersByFeatured<T extends { featured: boolean }>(
  dealers: T[]
): T[] {
  return [...dealers].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return 0;
  });
}
