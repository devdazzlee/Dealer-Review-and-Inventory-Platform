import type { RatingSettings } from "@/lib/api/admin-client";

/**
 * Client-side mirror of backend combined-rating math for admin live preview.
 * Must stay in sync with backend/src/utils/rating.ts
 */
export function calculateCombinedPreview(
  dealer: {
    googleRating: number | null;
    yelpRating: number | null;
    carfaxRating: number | null;
    autoSalesReviewsRating: number | null;
    platformRating: number | null;
    useManualRating: boolean;
    manualRatingOverride: number | null;
    googleReviewCount: number | null;
    yelpReviewCount: number | null;
    platformReviewCount: number;
  },
  settings: Pick<
    RatingSettings,
    | "googleEnabled"
    | "yelpEnabled"
    | "carfaxEnabled"
    | "autoSalesReviewsEnabled"
    | "platformEnabled"
  >
) {
  if (dealer.useManualRating && dealer.manualRatingOverride != null) {
    return {
      combinedRating: Math.round(dealer.manualRatingOverride * 10) / 10,
    };
  }

  const values: number[] = [];
  if (settings.googleEnabled && dealer.googleRating != null)
    values.push(dealer.googleRating);
  // Yelp is deliberately excluded from the average — Yelp's API terms forbid
  // blending its rating into an aggregated multi-source score. It's shown as
  // its own standalone badge instead (see backend/src/utils/rating.ts).
  if (settings.carfaxEnabled && dealer.carfaxRating != null)
    values.push(dealer.carfaxRating);
  if (settings.autoSalesReviewsEnabled && dealer.autoSalesReviewsRating != null)
    values.push(dealer.autoSalesReviewsRating);
  if (settings.platformEnabled && dealer.platformRating != null)
    values.push(dealer.platformRating);

  if (values.length === 0) return { combinedRating: null as number | null };

  const sum = values.reduce((a, b) => a + b, 0);
  return { combinedRating: Math.round((sum / values.length) * 10) / 10 };
}
