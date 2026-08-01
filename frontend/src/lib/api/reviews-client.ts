import { env } from "@/config/env";
import type { ApiErrorResponse, SubmitReviewPayload } from "@/types/dealer";

async function parseError(response: Response): Promise<string> {
  const body: ApiErrorResponse = await response.json().catch(() => ({
    error: "Request failed",
  }));
  return body.error || "Request failed";
}

/** Browser-side API helpers (reviews submit / helpful votes). */
export async function submitReview(payload: SubmitReviewPayload) {
  const response = await fetch(`${env.apiBaseUrl}/api/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<{ success: boolean; message: string }>;
}

export async function voteReviewHelpful(reviewId: string, helpful: boolean) {
  const response = await fetch(
    `${env.apiBaseUrl}/api/reviews/${reviewId}/helpful`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ helpful }),
    }
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<{
    helpfulCount: number;
    notHelpfulCount: number;
    userVote: boolean | null;
  }>;
}

export async function reportReview(reviewId: string, reason: string) {
  const response = await fetch(
    `${env.apiBaseUrl}/api/reviews/${reviewId}/report`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    }
  );

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return response.json() as Promise<{ success: boolean; message: string }>;
}

export async function fetchDealerReviews(
  slug: string,
  options: { page: number; sort: string }
) {
  const params = new URLSearchParams({
    page: String(options.page),
    sort: options.sort,
  });
  const response = await fetch(
    `${env.apiBaseUrl}/api/dealers/${slug}/reviews?${params}`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}

export async function fetchDealerReviewStats(slug: string) {
  const response = await fetch(
    `${env.apiBaseUrl}/api/dealers/${slug}/review-stats`,
    { cache: "no-store" }
  );
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return response.json();
}
