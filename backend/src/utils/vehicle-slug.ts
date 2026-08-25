import { generateSlug } from "./slug";

/**
 * Trailing chars of the vehicle's own cuid, reused as a short unique
 * identifier — no extra stored field, no collision bookkeeping needed.
 * Cuids are lowercase base36, so this is always URL-safe.
 */
const SHORT_ID_LENGTH = 6;

export interface VehicleSlugSource {
  id: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
}

/** Builds the `[year-make-model-trim]-[short-id]` URL segment for a vehicle. */
export function buildVehicleSlug(vehicle: VehicleSlugSource): string {
  const descriptor = generateSlug(
    [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
      .filter(Boolean)
      .join(" ")
  );
  const shortId = vehicle.id.slice(-SHORT_ID_LENGTH);
  return descriptor ? `${descriptor}-${shortId}` : shortId;
}

/**
 * Pulls the short id back out of a vehicle slug for lookup. The descriptive
 * prefix is intentionally NOT validated against current vehicle data — a
 * stale year/make/model/trim in an old bookmarked/indexed URL should still
 * resolve to the right vehicle, not 404.
 */
export function extractVehicleShortId(vehicleSlug: string): string | null {
  const match = /-([a-z0-9]{6})$/i.exec(vehicleSlug);
  if (match) return match[1].toLowerCase();
  // No descriptor at all (pure short id, e.g. year/make/model/trim were all empty).
  if (/^[a-z0-9]{6}$/i.test(vehicleSlug)) return vehicleSlug.toLowerCase();
  return null;
}
