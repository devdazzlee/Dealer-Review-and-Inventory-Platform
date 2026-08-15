import type { Dealer, RatingSourceSettings } from "@prisma/client";

/** Round to one decimal place (e.g. 4.27 → 4.3). */
export function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function computeAverageRating(ratings: number[]): number {
  if (ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, rating) => acc + rating, 0);
  return roundToOneDecimal(sum / ratings.length);
}

export type RatingSourceKey =
  | "google"
  | "yelp"
  | "carfax"
  | "autoSalesReviews"
  | "platform";

export interface RatingSourceContribution {
  key: RatingSourceKey;
  label: string;
  value: number;
  reviewCount: number | null;
  enabled: boolean;
  /**
   * Whether this source's value is folded into combinedRating's average.
   * False for Yelp — Yelp's API terms forbid blending its rating into an
   * aggregated multi-source score, so it's surfaced as its own standalone
   * badge (enabled can still be true) instead of averaged in.
   */
  combinable: boolean;
}

export interface CombinedRatingResult {
  combinedRating: number | null;
  sources: RatingSourceContribution[];
  includedSources: RatingSourceContribution[];
  totalReviewCount: number;
}

type DealerRatingFields = Pick<
  Dealer,
  | "googleRating"
  | "googleReviewCount"
  | "yelpRating"
  | "yelpReviewCount"
  | "carfaxRating"
  | "autoSalesReviewsRating"
  | "platformRating"
  | "platformReviewCount"
  | "manualRatingOverride"
  | "useManualRating"
>;

type SettingsFields = Pick<
  RatingSourceSettings,
  | "googleEnabled"
  | "yelpEnabled"
  | "carfaxEnabled"
  | "autoSalesReviewsEnabled"
  | "platformEnabled"
>;

/**
 * Combined rating = average of enabled sources that have a value.
 * Manual override skips the average when useManualRating is true.
 */
export function calculateCombinedRating(
  dealer: DealerRatingFields,
  settings: SettingsFields
): CombinedRatingResult {
  const sources: RatingSourceContribution[] = [
    {
      key: "google",
      label: "Google",
      value: dealer.googleRating ?? NaN,
      reviewCount: dealer.googleReviewCount ?? null,
      enabled: settings.googleEnabled && dealer.googleRating != null,
      combinable: true,
    },
    {
      key: "yelp",
      label: "Yelp",
      value: dealer.yelpRating ?? NaN,
      reviewCount: dealer.yelpReviewCount ?? null,
      enabled: settings.yelpEnabled && dealer.yelpRating != null,
      combinable: false,
    },
    {
      key: "carfax",
      label: "Carfax",
      value: dealer.carfaxRating ?? NaN,
      reviewCount: null,
      enabled: settings.carfaxEnabled && dealer.carfaxRating != null,
      combinable: true,
    },
    {
      key: "autoSalesReviews",
      label: "AutoSalesReviews",
      value: dealer.autoSalesReviewsRating ?? NaN,
      reviewCount: null,
      enabled:
        settings.autoSalesReviewsEnabled &&
        dealer.autoSalesReviewsRating != null,
      combinable: true,
    },
    {
      key: "platform",
      label: "Platform",
      value: dealer.platformRating ?? NaN,
      reviewCount: dealer.platformReviewCount || null,
      enabled: settings.platformEnabled && dealer.platformRating != null,
      combinable: true,
    },
  ];

  const includedSources = sources.filter((s) => s.enabled && s.combinable);

  let combinedRating: number | null = null;

  if (dealer.useManualRating && dealer.manualRatingOverride != null) {
    combinedRating = roundToOneDecimal(dealer.manualRatingOverride);
  } else if (includedSources.length > 0) {
    const sum = includedSources.reduce((acc, s) => acc + s.value, 0);
    combinedRating = roundToOneDecimal(sum / includedSources.length);
  }

  // Yelp's review count is intentionally excluded — it isn't part of the
  // combined average (see `combinable` above), so counting it here would
  // make "Combined · N reviews" imply Yelp reviews when they're not folded in.
  const totalReviewCount =
    (settings.googleEnabled ? dealer.googleReviewCount ?? 0 : 0) +
    (settings.platformEnabled ? dealer.platformReviewCount ?? 0 : 0);

  return {
    combinedRating,
    sources,
    includedSources,
    totalReviewCount,
  };
}

/** Legacy helper kept for callers that only have a numeric list. */
export function computeAverageFromRatings(ratings: number[]): number {
  return computeAverageRating(ratings);
}
