import "server-only";

import { apiClient } from "@/lib/api/client";
import { getRegion } from "@/config/constants";
import type {
  DealerDetail,
  DealerQueryParams,
  DealerSummary,
  DealersPage,
  ReviewSort,
  ReviewStats,
  ReviewsPage,
} from "@/types/dealer";

const DEALERS_PAGE_SIZE = 20;

function buildQueryString(
  params: DealerQueryParams,
  extra?: { page?: number; pageSize?: number }
): string {
  const searchParams = new URLSearchParams();

  if (params.state && params.state !== "All") {
    searchParams.set("state", params.state);
  }
  const region = getRegion(params.region);
  if (region) searchParams.set("states", region.states.join(","));
  if (params.city) searchParams.set("city", params.city);
  if (params.minRating) searchParams.set("minRating", params.minRating);
  if (params.search) searchParams.set("search", params.search);
  if (extra?.page) searchParams.set("page", String(extra.page));
  if (extra?.pageSize) searchParams.set("pageSize", String(extra.pageSize));

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

/** Full, unpaginated list — for callers that want everything at once
 * (sitemap generation, the homepage's "top rated dealers" section). Never
 * pass `page` through buildQueryString here, or the API switches into its
 * paginated response shape. */
export async function getDealers(
  params: DealerQueryParams = {}
): Promise<DealerSummary[]> {
  return apiClient<DealerSummary[]>(
    `/api/dealers${buildQueryString(params)}`
  );
}

/** Paginated dealer listing — for the actual Dealers browse page. */
export async function getDealersPaginated(
  params: DealerQueryParams = {}
): Promise<DealersPage> {
  const page = Number(params.page) || 1;
  return apiClient<DealersPage>(
    `/api/dealers${buildQueryString(params, { page, pageSize: DEALERS_PAGE_SIZE })}`
  );
}

/** Real dealer counts per state — used to compute the homepage region
 * counts ("128 dealers" etc.), which used to be hardcoded. */
export async function getDealerCountsByState(): Promise<
  { state: string; count: number }[]
> {
  const result = await apiClient<{ data: { state: string; count: number }[] }>(
    "/api/dealers/stats/by-state"
  );
  return result.data;
}

/**
 * Real dealer counts per city — used to filter curated SEO city pages down
 * to cities that actually have a dealer. Several pages (`/cities`,
 * `/dealers/state/[state]`, `/dealers/city/[city-state]`) call this during
 * static generation, so a transient backend hiccup here (a fresh deploy
 * not fully rolled out yet, a cold start, ...) must not fail the entire
 * site build — return an empty list instead, which `hasRealDealers()`
 * treats as "don't filter" so those pages just render unfiltered rather
 * than crashing the build.
 */
export async function getDealerCountsByCity(): Promise<
  { city: string; state: string; count: number }[]
> {
  try {
    const result = await apiClient<{
      data: { city: string; state: string; count: number }[];
    }>("/api/dealers/stats/by-city");
    return result.data;
  } catch (error) {
    console.error(
      "[getDealerCountsByCity] failed, skipping city filtering for this build:",
      error
    );
    return [];
  }
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
