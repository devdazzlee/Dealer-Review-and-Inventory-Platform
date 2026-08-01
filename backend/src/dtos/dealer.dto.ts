import type { RatingSourceSettings } from "@prisma/client";
import { calculateCombinedRating } from "../utils/rating";
import { DealerWithRatingFields } from "../types/dealer.types";

let cachedSettings: RatingSourceSettings | null = null;

/** Allow services to inject settings for batch mapping without N+1 fetches. */
export function setDtoSettingsCache(settings: RatingSourceSettings | null) {
  cachedSettings = settings;
}

function defaultSettings(): RatingSourceSettings {
  return (
    cachedSettings ?? {
      id: "default",
      googleEnabled: true,
      yelpEnabled: true,
      carfaxEnabled: true,
      autoSalesReviewsEnabled: true,
      platformEnabled: true,
      updatedAt: new Date(),
    }
  );
}

export function toDealerSummaryDto(
  dealer: DealerWithRatingFields,
  settings?: RatingSourceSettings
) {
  const result = calculateCombinedRating(dealer, settings ?? defaultSettings());
  const combined = result.combinedRating;
  const averageRating = combined ?? 0;

  return {
    id: dealer.id,
    name: dealer.name,
    slug: dealer.slug,
    city: dealer.city,
    state: dealer.state,
    phone: dealer.phone,
    website: dealer.website,
    featured: dealer.featured,
    averageRating,
    totalReviews: result.totalReviewCount,
    combinedRating: combined,
    platformRating: dealer.platformRating,
    platformReviewCount: dealer.platformReviewCount,
    googleRating: dealer.googleRating,
    googleReviewCount: dealer.googleReviewCount,
    yelpRating: dealer.yelpRating,
    yelpReviewCount: dealer.yelpReviewCount,
    carfaxRating: dealer.carfaxRating,
    autoSalesReviewsRating: dealer.autoSalesReviewsRating,
    hasBadge: dealer.hasBadge,
    badgeYear: dealer.badgeYear,
    ratingSources: result.sources.map((s) => ({
      key: s.key,
      label: s.label,
      rating: Number.isFinite(s.value) ? s.value : null,
      reviewCount: s.reviewCount,
      included: s.enabled,
    })),
  };
}

export function toDealerDetailDto(
  dealer: DealerWithRatingFields,
  settings?: RatingSourceSettings
) {
  const summary = toDealerSummaryDto(dealer, settings);

  return {
    ...summary,
    address: dealer.address,
    zip: dealer.zip,
    email: dealer.email,
    description: dealer.description,
    logo: dealer.logo,
    carfaxUrl: dealer.carfaxUrl,
    useManualRating: dealer.useManualRating,
    manualRatingOverride: dealer.manualRatingOverride,
    createdAt: dealer.createdAt,
  };
}
