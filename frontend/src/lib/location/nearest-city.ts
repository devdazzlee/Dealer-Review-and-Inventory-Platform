import { TARGET_CITIES, type TargetCity } from "@/config/locations/cities-data";

const EARTH_RADIUS_KM = 6371;

/**
 * This site only covers US markets, and only serves 27 specific cities —
 * a visitor genuinely inside the US can still legitimately be several
 * hundred km from the nearest one (rural Mountain West, etc.), but a
 * visitor outside the US/North America is typically thousands of km away.
 * Without this cap, `findNearestCity` had no concept of "too far" and
 * would confidently match a visitor in Pakistan (or anywhere else on
 * Earth) to whatever US city happened to be mathematically closest —
 * always returning *something*, never "you're outside our coverage
 * area." 800km comfortably covers real in-country edge cases while
 * still rejecting anything international.
 */
const MAX_MATCH_DISTANCE_KM = 800;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Nearest-neighbor match against the curated city list, used to turn a
 * raw browser coordinate into one of our served markets. Returns null if
 * the coordinate is too far from every served city to be a real US match
 * (see MAX_MATCH_DISTANCE_KM) — callers must handle that case rather than
 * personalizing to a nonsensically distant "nearest" city. */
export function findNearestCity(lat: number, lng: number): TargetCity | null {
  const closest = TARGET_CITIES.reduce((closest, candidate) => {
    const candidateDistance = haversineDistanceKm(
      lat,
      lng,
      candidate.lat,
      candidate.lng
    );
    const closestDistance = haversineDistanceKm(
      lat,
      lng,
      closest.lat,
      closest.lng
    );
    return candidateDistance < closestDistance ? candidate : closest;
  });

  const distance = haversineDistanceKm(lat, lng, closest.lat, closest.lng);
  return distance <= MAX_MATCH_DISTANCE_KM ? closest : null;
}
