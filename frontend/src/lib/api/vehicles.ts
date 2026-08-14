import "server-only";

import { apiClient } from "@/lib/api/client";
import type { Vehicle, VehicleFilters, VehicleSort } from "@/types/vehicle";
import { VEHICLES_PER_PAGE } from "@/config/vehicle";

export interface VehicleListResponse {
  data: Vehicle[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface VehicleDetailResponse {
  vehicle: Vehicle;
  similar: Vehicle[];
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export async function listVehicles(options: {
  filters?: VehicleFilters;
  sort?: VehicleSort;
  page?: number;
  pageSize?: number;
  dealerSlug?: string;
}): Promise<VehicleListResponse> {
  const filters = options.filters ?? {};
  return apiClient<VehicleListResponse>(
    `/api/vehicles${toQuery({
      make: filters.make,
      model: filters.model,
      yearFrom: filters.yearFrom,
      yearTo: filters.yearTo,
      priceFrom: filters.priceFrom,
      priceTo: filters.priceTo,
      maxMileage: filters.maxMileage,
      bodyStyle: filters.bodyStyle,
      condition: filters.condition,
      state: filters.state,
      city: filters.city,
      query: filters.query,
      sort: options.sort,
      page: options.page ?? 1,
      pageSize: options.pageSize ?? VEHICLES_PER_PAGE,
      dealerSlug: options.dealerSlug,
    })}`
  );
}

export async function getFeaturedVehiclesFromApi(
  limit = 6,
  location?: { city?: string; stateCode?: string }
): Promise<Vehicle[]> {
  const result = await apiClient<{ data: Vehicle[] }>(
    `/api/vehicles/featured${toQuery({
      limit,
      city: location?.city,
      state: location?.stateCode,
    })}`
  );
  return result.data;
}

export async function getVehiclesByDealerSlugFromApi(slug: string): Promise<Vehicle[]> {
  const result = await apiClient<{ data: Vehicle[] }>(
    `/api/vehicles/dealer/${encodeURIComponent(slug)}`
  );
  return result.data;
}

export async function getVehicleByIdFromApi(id: string): Promise<VehicleDetailResponse> {
  return apiClient<VehicleDetailResponse>(`/api/vehicles/${encodeURIComponent(id)}`);
}

export async function getVehicleSitemapEntries(): Promise<{ id: string }[]> {
  try {
    const result = await apiClient<{ data: { id: string }[] }>("/api/vehicles/sitemap");
    return result.data;
  } catch {
    return [];
  }
}
