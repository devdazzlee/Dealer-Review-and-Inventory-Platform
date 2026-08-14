import { Dealer, Review } from "@prisma/client";

export type DealerWithReviews = Dealer & {
  reviews: Pick<Review, "overallRating" | "status">[];
};

export type DealerWithRatingFields = Dealer;

export interface DealerListFilters {
  state?: string;
  city?: string;
  search?: string;
  minRating?: number;
}

export interface CreateDealerInput {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  description?: string | null;
  logo?: string | null;
  featured?: boolean;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  yelpRating?: number | null;
  yelpReviewCount?: number | null;
  carfaxRating?: number | null;
  carfaxUrl?: string | null;
  autoSalesReviewsRating?: number | null;
  manualRatingOverride?: number | null;
  useManualRating?: boolean;
  hasBadge?: boolean;
  badgeYear?: number | null;
  googlePlaceId?: string | null;
  autoDevDealerId?: string | null;
}

export interface RatingSourceDto {
  key: string;
  label: string;
  rating: number | null;
  reviewCount: number | null;
  included: boolean;
}

export interface DealerSummaryDto {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  featured: boolean;
  /** @deprecated use combinedRating — kept for backwards compatibility */
  averageRating: number;
  totalReviews: number;
  combinedRating: number | null;
  platformRating: number | null;
  platformReviewCount: number;
  googleRating: number | null;
  googleReviewCount: number | null;
  yelpRating: number | null;
  yelpReviewCount: number | null;
  carfaxRating: number | null;
  autoSalesReviewsRating: number | null;
  hasBadge: boolean;
  badgeYear: number | null;
  ratingSources: RatingSourceDto[];
  vehicleCount: number;
}

export interface DealerDetailDto extends DealerSummaryDto {
  address: string;
  zip: string;
  email: string | null;
  description: string | null;
  logo: string | null;
  carfaxUrl: string | null;
  useManualRating: boolean;
  manualRatingOverride: number | null;
  googlePlaceId: string | null;
  autoDevDealerId: string | null;
  createdAt: Date;
}

export interface UpdateDealerAdminInput {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  description?: string | null;
  logo?: string | null;
  featured?: boolean;
  googleRating?: number | null;
  googleReviewCount?: number | null;
  yelpRating?: number | null;
  yelpReviewCount?: number | null;
  carfaxRating?: number | null;
  carfaxUrl?: string | null;
  autoSalesReviewsRating?: number | null;
  manualRatingOverride?: number | null;
  useManualRating?: boolean;
  hasBadge?: boolean;
  badgeYear?: number | null;
  googlePlaceId?: string | null;
  autoDevDealerId?: string | null;
}
