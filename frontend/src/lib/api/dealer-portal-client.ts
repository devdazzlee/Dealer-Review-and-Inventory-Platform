import { env } from "@/config/env";
import type { AdminDealer } from "./admin-client";

const TOKEN_KEY = "asr_dealer_portal_token";

export function getDealerPortalToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setDealerPortalToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearDealerPortalToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function dealerFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getDealerPortalToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers ?? {}),
    ...(token ? { "X-Dealer-Token": token } : {}),
  };

  const response = await fetch(`${env.apiBaseUrl}${path}`, { ...options, headers });

  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(body.error || `Request failed (${response.status})`);
  }

  return response.json() as Promise<T>;
}

export interface DealerPortalReview {
  id: string;
  authorName: string;
  email: string;
  overallRating: number;
  title: string;
  comment: string;
  status: string;
  createdAt: string;
  dealerReply: string | null;
  dealerRepliedAt: string | null;
}

export interface DealerUpdateDto {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

export interface DealerVehicleDto {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  mileage: number | null;
  bodyStyle: string | null;
  fuelType: string | null;
  transmission: string | null;
  exteriorColor: string | null;
  interiorColor: string | null;
  condition: string | null;
  price: number | null;
  description: string | null;
  features: string[];
  photos: string[];
  isActive: boolean;
  source: string;
  updatedAt: string;
  createdAt: string;
}

export interface DealerVehicleInput {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string | null;
  mileage?: number | null;
  bodyStyle?: string | null;
  fuelType?: string | null;
  transmission?: string | null;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  condition?: string | null;
  price?: number | null;
  description?: string | null;
  /** Comma or newline separated — the backend splits it. */
  features?: string;
  /** Newline separated URLs — the backend splits it. */
  photos?: string;
}

export const dealerPortalApi = {
  login(loginEmail: string, password: string) {
    return dealerFetch<{
      token: string;
      dealerId: string;
      dealerName: string;
      slug: string;
    }>("/api/dealer-portal/login", {
      method: "POST",
      body: JSON.stringify({ loginEmail, password }),
    });
  },
  logout() {
    return dealerFetch("/api/dealer-portal/logout", { method: "POST" });
  },
  changePassword(body: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    return dealerFetch<{ success: boolean }>("/api/dealer-portal/change-password", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  me() {
    return dealerFetch<AdminDealer>("/api/dealer-portal/me");
  },
  updateProfile(body: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    website?: string | null;
    description?: string | null;
    logo?: string | null;
  }) {
    return dealerFetch<AdminDealer>("/api/dealer-portal/profile", {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  reviews(params: { status?: string; page?: number } = {}) {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    qs.set("page", String(params.page ?? 1));
    return dealerFetch<{
      reviews: DealerPortalReview[];
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/dealer-portal/reviews?${qs}`);
  },
  replyToReview(id: string, reply: string | null) {
    return dealerFetch<{ success: boolean; review: DealerPortalReview }>(
      `/api/dealer-portal/reviews/${id}/reply`,
      { method: "PUT", body: JSON.stringify({ reply }) }
    );
  },
  updates() {
    return dealerFetch<DealerUpdateDto[]>("/api/dealer-portal/updates");
  },
  postUpdate(title: string, body: string) {
    return dealerFetch<DealerUpdateDto>("/api/dealer-portal/updates", {
      method: "POST",
      body: JSON.stringify({ title, body }),
    });
  },
  editUpdate(id: string, title: string, body: string) {
    return dealerFetch<DealerUpdateDto>(`/api/dealer-portal/updates/${id}`, {
      method: "PUT",
      body: JSON.stringify({ title, body }),
    });
  },
  deleteUpdate(id: string) {
    return dealerFetch<{ success: boolean }>(`/api/dealer-portal/updates/${id}`, {
      method: "DELETE",
    });
  },
  vehicles() {
    return dealerFetch<DealerVehicleDto[]>("/api/dealer-portal/vehicles");
  },
  createVehicle(body: DealerVehicleInput) {
    return dealerFetch<DealerVehicleDto>("/api/dealer-portal/vehicles", {
      method: "POST",
      body: JSON.stringify(body),
    });
  },
  updateVehicle(id: string, body: DealerVehicleInput) {
    return dealerFetch<DealerVehicleDto>(`/api/dealer-portal/vehicles/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  },
  deleteVehicle(id: string) {
    return dealerFetch<{ success: boolean }>(`/api/dealer-portal/vehicles/${id}`, {
      method: "DELETE",
    });
  },
  async uploadImage(file: File, type: "vehicle" | "logo"): Promise<{ url: string }> {
    const token = getDealerPortalToken();
    const form = new FormData();
    form.append("image", file);

    const response = await fetch(
      `${env.apiBaseUrl}/api/dealer-portal/uploads/image?type=${type}`,
      {
        method: "POST",
        // No Content-Type here — the browser sets the multipart boundary itself.
        headers: token ? { "X-Dealer-Token": token } : undefined,
        body: form,
      }
    );

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: "Upload failed" }));
      throw new Error(body.error || `Upload failed (${response.status})`);
    }
    return response.json();
  },
};
