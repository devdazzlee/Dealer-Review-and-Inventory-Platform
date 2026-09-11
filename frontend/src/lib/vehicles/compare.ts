import { ROUTES } from "@/config/constants";
import type { CompareVehicleSummary, Vehicle } from "@/types/vehicle";

/** Comparisons beyond this many columns stop being readable side by side. */
export const MAX_COMPARE_VEHICLES = 4;

function dedupe(ids: string[]): string[] {
  return Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
}

export function buildCompareUrl(ids: string[]): string {
  const unique = dedupe(ids).slice(0, MAX_COMPARE_VEHICLES);
  const searchParams = new URLSearchParams();
  if (unique.length > 0) searchParams.set("ids", unique.join(","));

  const query = searchParams.toString();
  return `${ROUTES.compare}${query ? `?${query}` : ""}`;
}

export function parseCompareIds(
  idsParam: string | string[] | undefined
): string[] {
  const raw = Array.isArray(idsParam) ? idsParam[0] : idsParam;
  if (!raw) return [];
  return dedupe(raw.split(",")).slice(0, MAX_COMPARE_VEHICLES);
}

/** Extracts the lightweight fields the compare tray needs, from a full Vehicle. */
export function toCompareVehicleSummary(
  vehicle: Vehicle
): CompareVehicleSummary {
  const { id, year, make, model, trim, price, bodyStyle, accent, photoCount } =
    vehicle;
  return {
    id,
    year,
    make,
    model,
    trim,
    price,
    bodyStyle,
    accent,
    photoCount,
    // Only the first image — enough for the 56px tray thumbnail, without
    // persisting the whole gallery to localStorage.
    photos: vehicle.photos?.slice(0, 1),
  };
}
