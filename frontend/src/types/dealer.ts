export interface RatingSourceDto {
  key: string;
  label: string;
  rating: number | null;
  reviewCount: number | null;
  included: boolean;
}

export interface DealerSummary {
  id: string;
  name: string;
  slug: string;
  city: string;
  state: string;
  phone: string | null;
  website: string | null;
  featured: boolean;
  /** Back-compat alias of combinedRating (0 when none). */
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
}

export interface DealerDetail extends DealerSummary {
  address: string;
  zip: string;
  email: string | null;
  description: string | null;
  logo: string | null;
  carfaxUrl: string | null;
  useManualRating: boolean;
  manualRatingOverride: number | null;
  createdAt: string;
}

export interface DealerQueryParams {
  state?: string;
  city?: string;
  minRating?: string;
  search?: string;
  /** Frontend-only: broad US region, applied after fetching (API has no region param). */
  region?: string;
}

export interface ApiErrorResponse {
  error: string;
  code?: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type ReviewSort = "recent" | "highest" | "lowest";

export interface PublicReview {
  id: string;
  authorName: string;
  initials: string;
  overallRating: number;
  customerServiceRating: number | null;
  qualityRating: number | null;
  friendlinessRating: number | null;
  pricingRating: number | null;
  recommend: boolean | null;
  title: string;
  comment: string;
  visitType: string | null;
  visitDate: string | null;
  helpfulCount: number;
  notHelpfulCount: number;
  createdAt: string;
}

export interface ReviewsPage {
  reviews: PublicReview[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ReviewStats {
  totalReviews: number;
  averageRating: number | null;
  distribution: { stars: number; count: number; percentage: number }[];
  categoryAverages: {
    customerService: number | null;
    quality: number | null;
    friendliness: number | null;
    pricing: number | null;
  };
}

export interface SubmitReviewPayload {
  dealerSlug: string;
  authorName: string;
  email: string;
  overallRating: number;
  customerServiceRating?: number | null;
  qualityRating?: number | null;
  friendlinessRating?: number | null;
  pricingRating?: number | null;
  recommend?: boolean | null;
  title: string;
  comment: string;
  visitDate?: string | null;
  visitType?: string | null;
  website?: string;
  formOpenMs: number;
}

export const VISIT_TYPE_OPTIONS = [
  "Purchased New Car",
  "Purchased Used Car",
  "Service Visit",
  "Just Looking",
] as const;
