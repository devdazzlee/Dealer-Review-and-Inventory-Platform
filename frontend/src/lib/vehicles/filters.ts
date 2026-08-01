import type { Vehicle, VehicleFilters, VehicleSort } from "@/types/vehicle";
import { STATE_LABELS } from "@/config/constants";

function toNumber(value?: string | null): number | undefined {
  if (value === undefined || value === null || value === "" || value === "any") {
    return undefined;
  }
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export type VehicleSearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function parseVehicleFilters(
  params: VehicleSearchParams
): VehicleFilters {
  return {
    make: first(params.make) || undefined,
    model: first(params.model) || undefined,
    yearFrom: toNumber(first(params.yearFrom)),
    yearTo: toNumber(first(params.yearTo)),
    priceFrom: toNumber(first(params.priceFrom)),
    priceTo: toNumber(first(params.priceTo)),
    maxMileage: toNumber(first(params.maxMileage)),
    bodyStyle: first(params.bodyStyle) || undefined,
    condition: first(params.condition) || undefined,
    state: first(params.state) || undefined,
    city: first(params.city) || undefined,
    minRating: toNumber(first(params.minRating)),
    query: first(params.query) || undefined,
  };
}

export function parseVehicleSort(params: VehicleSearchParams): VehicleSort {
  const value = first(params.sort);
  const allowed: VehicleSort[] = [
    "relevance",
    "price-asc",
    "price-desc",
    "newest",
    "rating",
  ];
  return allowed.includes(value as VehicleSort)
    ? (value as VehicleSort)
    : "relevance";
}

export function parsePage(params: VehicleSearchParams): number {
  const value = toNumber(first(params.page));
  return value && value > 0 ? Math.floor(value) : 1;
}

/** "Luxury" is a marketing category on the homepage, not a body style. */
const LUXURY_MAKES = new Set(["BMW", "Mercedes-Benz", "Tesla"]);

export function matchesFilters(
  vehicle: Vehicle,
  filters: VehicleFilters
): boolean {
  if (filters.make && vehicle.make !== filters.make) return false;

  if (
    filters.model &&
    !vehicle.model.toLowerCase().includes(filters.model.toLowerCase())
  ) {
    return false;
  }

  if (filters.yearFrom && vehicle.year < filters.yearFrom) return false;
  if (filters.yearTo && vehicle.year > filters.yearTo) return false;

  if (filters.priceFrom && vehicle.price < filters.priceFrom) return false;
  if (filters.priceTo && vehicle.price > filters.priceTo) return false;

  if (filters.maxMileage && vehicle.mileage > filters.maxMileage) return false;

  if (filters.bodyStyle) {
    if (filters.bodyStyle === "Luxury") {
      if (!LUXURY_MAKES.has(vehicle.make)) return false;
    } else if (vehicle.bodyStyle !== filters.bodyStyle) {
      return false;
    }
  }

  if (filters.condition && vehicle.condition !== filters.condition) {
    return false;
  }

  if (filters.state && vehicle.dealer.state !== filters.state) return false;

  if (filters.city) {
    const city = filters.city.trim().toLowerCase();
    if (vehicle.dealer.city.toLowerCase() !== city) return false;
  }

  if (
    filters.minRating &&
    vehicle.dealer.ratings.combined != null &&
    vehicle.dealer.ratings.combined < filters.minRating
  ) {
    return false;
  }

  if (filters.query) {
    const haystack =
      `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.bodyStyle} ${vehicle.dealer.name}`.toLowerCase();
    if (!haystack.includes(filters.query.toLowerCase())) return false;
  }

  return true;
}

export function sortVehicles(
  vehicles: Vehicle[],
  sort: VehicleSort
): Vehicle[] {
  const list = [...vehicles];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "newest":
      return list.sort((a, b) => b.year - a.year || b.freshness - a.freshness);
    case "rating":
      return list.sort(
        (a, b) =>
          (b.dealer.ratings.combined ?? 0) - (a.dealer.ratings.combined ?? 0)
      );
    case "relevance":
    default:
      // Keep featured-first ordering already applied in the source list.
      return list;
  }
}

export function filterAndSortVehicles(
  vehicles: Vehicle[],
  filters: VehicleFilters,
  sort: VehicleSort
): Vehicle[] {
  const filtered = vehicles.filter((v) => matchesFilters(v, filters));
  return sortVehicles(filtered, sort);
}

export function countActiveFilters(filters: VehicleFilters): number {
  return Object.values(filters).filter(
    (v) => v !== undefined && v !== "" && v !== null
  ).length;
}

export function stateLabel(code?: string): string | undefined {
  return code ? STATE_LABELS[code.toUpperCase()] : undefined;
}
