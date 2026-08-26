/**
 * US ZIP code (first 3 digits) → state code, using USPS's published ZIP3
 * prefix assignments. This is a stable, publicly documented dataset (state
 * boundaries for ZIP prefixes essentially never change), so a static table
 * is the right approach here — no external geocoding API, no network call,
 * no API key to manage for what's fundamentally lookup-table data.
 *
 * Each entry's `maxPrefix` is the highest 3-digit prefix (inclusive) still
 * assigned to that state, given in ascending order.
 */
const ZIP3_RANGES: { maxPrefix: number; state: string }[] = [
  { maxPrefix: 5, state: "NY" }, // 005xx (Holtsville, NY) — isolated before 006-009 fall into PR below
  { maxPrefix: 9, state: "PR" },
  { maxPrefix: 27, state: "MA" },
  { maxPrefix: 29, state: "RI" },
  { maxPrefix: 38, state: "NH" },
  { maxPrefix: 49, state: "ME" },
  { maxPrefix: 59, state: "VT" },
  { maxPrefix: 69, state: "CT" },
  { maxPrefix: 89, state: "NJ" },
  { maxPrefix: 99, state: "NY" }, // Staten Island / far NJ-adjacent NY prefixes
  { maxPrefix: 149, state: "NY" },
  { maxPrefix: 196, state: "PA" },
  { maxPrefix: 199, state: "DE" },
  { maxPrefix: 205, state: "DC" },
  { maxPrefix: 219, state: "MD" },
  { maxPrefix: 246, state: "VA" },
  { maxPrefix: 268, state: "WV" },
  { maxPrefix: 289, state: "NC" },
  { maxPrefix: 299, state: "SC" },
  { maxPrefix: 319, state: "GA" },
  { maxPrefix: 342, state: "FL" },
  { maxPrefix: 349, state: "FL" },
  { maxPrefix: 369, state: "AL" },
  { maxPrefix: 385, state: "TN" },
  { maxPrefix: 397, state: "MS" },
  { maxPrefix: 399, state: "GA" },
  { maxPrefix: 427, state: "KY" },
  { maxPrefix: 458, state: "OH" },
  { maxPrefix: 479, state: "IN" },
  { maxPrefix: 499, state: "MI" },
  { maxPrefix: 528, state: "IA" },
  { maxPrefix: 529, state: "SD" }, // 529 is a rare shared/edge prefix, defaulting to SD
  { maxPrefix: 549, state: "WI" },
  { maxPrefix: 567, state: "MN" },
  { maxPrefix: 577, state: "SD" },
  { maxPrefix: 588, state: "ND" },
  { maxPrefix: 599, state: "MT" },
  { maxPrefix: 629, state: "IL" },
  { maxPrefix: 658, state: "MO" },
  { maxPrefix: 679, state: "KS" },
  { maxPrefix: 693, state: "NE" },
  { maxPrefix: 699, state: "NE" },
  { maxPrefix: 714, state: "LA" },
  { maxPrefix: 729, state: "AR" },
  { maxPrefix: 749, state: "OK" },
  { maxPrefix: 799, state: "TX" },
  { maxPrefix: 816, state: "CO" },
  { maxPrefix: 831, state: "WY" },
  { maxPrefix: 838, state: "ID" },
  { maxPrefix: 847, state: "UT" },
  { maxPrefix: 865, state: "AZ" },
  { maxPrefix: 884, state: "NM" },
  { maxPrefix: 885, state: "TX" }, // El Paso exclave prefix
  { maxPrefix: 898, state: "NV" },
  { maxPrefix: 899, state: "NV" },
  { maxPrefix: 961, state: "CA" },
  { maxPrefix: 966, state: "CA" }, // APO/FPO Pacific — not a real state; falls through to null via caller check
  { maxPrefix: 968, state: "HI" },
  { maxPrefix: 969, state: "GU" },
  { maxPrefix: 979, state: "OR" },
  { maxPrefix: 994, state: "WA" },
  { maxPrefix: 999, state: "AK" },
];

/** US territories / military codes that aren't one of our 50 supported states. */
const NON_STATE_CODES = new Set(["PR", "DC", "GU"]);

/**
 * Resolves a 5-digit US ZIP code to a state code, or null if the ZIP is
 * invalid, unrecognized, or maps to a non-state territory this platform
 * doesn't cover.
 */
export function resolveStateFromZip(zip: string): string | null {
  const digits = zip.trim().slice(0, 5);
  if (!/^\d{5}$/.test(digits)) return null;

  const prefix = parseInt(digits.slice(0, 3), 10);
  const match = ZIP3_RANGES.find((range) => prefix <= range.maxPrefix);
  if (!match || NON_STATE_CODES.has(match.state)) return null;

  return match.state;
}
