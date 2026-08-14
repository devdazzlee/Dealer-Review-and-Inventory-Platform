import { env } from "@/config/env";

const TOKEN_KEY = "asr_admin_token";

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function adminFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAdminToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
    ...(token ? { "X-Admin-Token": token } : {}),
  };

  const response = await fetch(`${env.apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export const adminApi = {
  login(password: string) {
    return adminFetch<{ success: boolean; token: string }>("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
  },
  changePassword(body: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return adminFetch<{ success: boolean; message: string; token: string }>(
      "/api/admin/change-password",
      {
        method: "POST",
        body: JSON.stringify(body),
      }
    );
  },
  dashboard() {
    return adminFetch<{
      dealers: number;
      dealersFeatured: number;
      dealersBadged: number;
      reviews: {
        pending: number;
        approved: number;
        rejected: number;
        total: number;
      };
      reports: {
        open: number;
        resolved: number;
        total: number;
      };
      pendingUrgent: boolean;
      recentActivity: {
        id: string;
        status: string;
        authorName: string;
        title: string;
        overallRating: number;
        dealerName: string;
        dealerSlug: string;
        createdAt: string;
      }[];
    }>("/api/admin/dashboard");
  },
  reviews(params: {
    status?: string;
    search?: string;
    dealerId?: string;
    rating?: number;
    page?: number;
  }) {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.search) qs.set("search", params.search);
    if (params.dealerId) qs.set("dealerId", params.dealerId);
    if (params.rating) qs.set("rating", String(params.rating));
    qs.set("page", String(params.page ?? 1));
    return adminFetch<{
      reviews: AdminReview[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/admin/reviews?${qs}`);
  },
  reviewAction(id: string, action: "approve" | "reject" | "delete") {
    return adminFetch(`/api/admin/reviews/${id}`, {
      method: "PUT",
      body: JSON.stringify({ action }),
    });
  },
  bulkReviews(ids: string[], action: "approve" | "reject" | "delete") {
    return adminFetch("/api/admin/reviews/bulk", {
      method: "POST",
      body: JSON.stringify({ ids, action }),
    });
  },
  dealers(params: {
    search?: string;
    featured?: boolean;
    hasBadge?: boolean;
    page?: number;
  }) {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.featured !== undefined) qs.set("featured", String(params.featured));
    if (params.hasBadge !== undefined) qs.set("hasBadge", String(params.hasBadge));
    qs.set("page", String(params.page ?? 1));
    return adminFetch<{
      dealers: AdminDealer[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/admin/dealers?${qs}`);
  },
  updateDealer(id: string, body: Record<string, unknown>) {
    return adminFetch<AdminDealer>(`/api/admin/dealers/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  createDealer(body: Record<string, unknown>) {
    return adminFetch<AdminDealer>("/api/admin/dealers", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  deleteDealer(id: string) {
    return adminFetch<{ success: boolean; id: string }>(
      `/api/admin/dealers/${id}`,
      { method: "DELETE" }
    );
  },
  ratingSettings() {
    return adminFetch<RatingSettings>("/api/admin/rating-settings");
  },
  updateRatingSettings(body: Partial<RatingSettings>) {
    return adminFetch<{
      settings: RatingSettings;
      impact: unknown;
    }>("/api/admin/rating-settings", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  badgedDealers() {
    return adminFetch<AdminDealer[]>("/api/admin/badges");
  },
  dealersSelect() {
    return adminFetch<
      { id: string; name: string; slug: string; hasBadge: boolean; badgeYear: number | null }[]
    >("/api/admin/dealers/select");
  },
  assignBadge(dealerId: string, badgeYear: number) {
    return adminFetch("/api/admin/badges/assign", {
      method: "POST",
      body: JSON.stringify({ dealerId, badgeYear }),
    });
  },
  revokeBadge(dealerId: string) {
    return adminFetch(`/api/admin/badges/${dealerId}/revoke`, {
      method: "POST",
    });
  },
  reports(params: { status?: string; search?: string; page?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.search) qs.set("search", params.search);
    qs.set("page", String(params.page ?? 1));
    return adminFetch<{
      reports: AdminReport[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/admin/reports?${qs}`);
  },
  resolveReport(id: string) {
    return adminFetch(`/api/admin/reports/${id}/resolve`, {
      method: "POST",
    });
  },
  blog(params: { page?: number; search?: string } = {}) {
    const qs = new URLSearchParams();
    qs.set("page", String(params.page ?? 1));
    if (params.search) qs.set("search", params.search);
    return adminFetch<{
      data: AdminBlogPost[];
      total: number;
      page: number;
      totalPages: number;
    }>(`/api/admin/blog?${qs}`);
  },
  getBlog(id: string) {
    return adminFetch<AdminBlogPost>(`/api/admin/blog/${id}`);
  },
  createBlog(body: Partial<AdminBlogPost>) {
    return adminFetch<AdminBlogPost>("/api/admin/blog", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  updateBlog(id: string, body: Partial<AdminBlogPost>) {
    return adminFetch<AdminBlogPost>(`/api/admin/blog/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  deleteBlog(id: string) {
    return adminFetch(`/api/admin/blog/${id}`, { method: "DELETE" });
  },
};

export interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  author: string;
  authorRole: string;
  authorBio: string | null;
  featuredImageUrl: string | null;
  featuredImageAlt: string | null;
  body: unknown;
  faqs: unknown;
  metaTitle: string;
  metaDescription: string;
  published: boolean;
  featured: boolean;
  publishedAt: string | null;
}

export interface AdminReport {
  id: string;
  reason: string;
  status: string;
  createdAt: string;
  resolvedAt: string | null;
  review: {
    id: string;
    authorName: string;
    title: string;
    comment: string;
    overallRating: number;
    status: string;
    dealer: { id: string; name: string; slug: string };
  };
}

export interface AdminReview {
  id: string;
  authorName: string;
  email: string;
  overallRating: number;
  title: string;
  comment: string;
  status: string;
  createdAt: string;
  customerServiceRating: number | null;
  qualityRating: number | null;
  friendlinessRating: number | null;
  pricingRating: number | null;
  recommend: boolean | null;
  visitType: string | null;
  helpfulCount: number;
  notHelpfulCount: number;
  dealer: { id: string; name: string; slug: string };
}

export interface AdminDealer {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  description: string | null;
  featured: boolean;
  googleRating: number | null;
  googleReviewCount: number | null;
  yelpRating: number | null;
  yelpReviewCount: number | null;
  carfaxRating: number | null;
  carfaxUrl: string | null;
  autoSalesReviewsRating: number | null;
  platformRating: number | null;
  platformReviewCount: number;
  combinedRating: number | null;
  manualRatingOverride: number | null;
  useManualRating: boolean;
  hasBadge: boolean;
  badgeYear: number | null;
  googlePlaceId: string | null;
  autoDevDealerId: string | null;
  totalReviews: number;
  ratingSources: {
    key: string;
    label: string;
    rating: number | null;
    reviewCount: number | null;
    included: boolean;
  }[];
}

export interface RatingSettings {
  id: string;
  googleEnabled: boolean;
  yelpEnabled: boolean;
  carfaxEnabled: boolean;
  autoSalesReviewsEnabled: boolean;
  platformEnabled: boolean;
  updatedAt: string;
}
