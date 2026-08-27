import type { TargetCity } from "@/config/locations/cities-data";

/**
 * TARGET_CITIES is a hand-curated list of SEO landing-page cities, kept
 * independent of which cities actually have a real dealer today. Linking to
 * (or indexing) a city page with zero dealers is thin content — this checks
 * a city against a real per-city dealer count before it's shown or linked.
 */
export function hasRealDealers(
  city: Pick<TargetCity, "city" | "stateCode">,
  cityCounts: { city: string; state: string; count: number }[]
): boolean {
  return cityCounts.some(
    (c) =>
      c.count > 0 &&
      c.city.toLowerCase() === city.city.toLowerCase() &&
      c.state.toUpperCase() === city.stateCode.toUpperCase()
  );
}
