import "server-only";

import { apiClient } from "@/lib/api/client";
import type {
  DealerDetail,
  DealerQueryParams,
  DealerSummary,
  ReviewSort,
  ReviewStats,
  ReviewsPage,
} from "@/types/dealer";

function buildQueryString(params: DealerQueryParams): string {
  const searchParams = new URLSearchParams();

  if (params.state && params.state !== "All") {
    searchParams.set("state", params.state);
  }
  if (params.city) searchParams.set("city", params.city);
  if (params.minRating) searchParams.set("minRating", params.minRating);
  if (params.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function getDealers(
  params: DealerQueryParams = {}
): Promise<DealerSummary[]> {
  return apiClient<DealerSummary[]>(
    `/api/dealers${buildQueryString(params)}`
  );
}

export async function getDealerBySlug(slug: string): Promise<DealerDetail> {
  return apiClient<DealerDetail>(`/api/dealers/${slug}`);
}

export async function getDealerReviews(
  slug: string,
  options: { page?: number; sort?: ReviewSort } = {}
): Promise<ReviewsPage> {
  const params = new URLSearchParams();
  params.set("page", String(options.page ?? 1));
  params.set("sort", options.sort ?? "recent");
  return apiClient<ReviewsPage>(
    `/api/dealers/${slug}/reviews?${params.toString()}`,
    { revalidate: 30 }
  );
}

export async function getDealerReviewStats(
  slug: string
): Promise<ReviewStats> {
  return apiClient<ReviewStats>(`/api/dealers/${slug}/review-stats`, {
    revalidate: 30,
  });
}
