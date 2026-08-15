/** US state codes supported by dealer list filters and seed data. */
export const VALID_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "DC",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
] as const;

export type StateCode = (typeof VALID_STATES)[number];

export const DEALER_SORT = {
  featuredFirst: { featured: "desc" as const },
  nameAsc: { name: "asc" as const },
} as const;

/** Auto.dev sync target — operational config, not listing pin order. */
export const AUTODEV = {
  dealerSlug: "bergen-car",
  dealerNameMatch: "bergen car",
  zip: "07652",
  distanceMiles: 10,
  pageSize: 100,
  maxPhotosPerVin: 30,
  baseUrl: "https://api.auto.dev",
} as const;

/**
 * Real-dealer discovery config. Auto.dev has no "browse all dealers"
 * endpoint — only distance-radius listing search — so nationwide coverage
 * is approximated by searching a curated set of metro zip codes.
 */
export const DEALER_DISCOVERY = {
  distanceMiles: 20,
  /** Pages per zip (20 listings/page on Starter plans) — enough to surface every distinct dealer in a metro. */
  maxPagesPerZip: 5,
  delayMsBetweenZips: 500,
} as const;

/** One representative zip per metro already covered by seeded (placeholder) dealers. */
export const DISCOVERY_TARGET_ZIPS: { city: string; state: string; zip: string }[] = [
  { city: "Allentown", state: "PA", zip: "18101" },
  { city: "Atlanta", state: "GA", zip: "30303" },
  { city: "Austin", state: "TX", zip: "78701" },
  { city: "Boston", state: "MA", zip: "02108" },
  { city: "Bridgeport", state: "CT", zip: "06604" },
  { city: "Bronx", state: "NY", zip: "10451" },
  { city: "Brooklyn", state: "NY", zip: "11201" },
  { city: "Charlotte", state: "NC", zip: "28202" },
  { city: "Chicago", state: "IL", zip: "60601" },
  { city: "Columbus", state: "OH", zip: "43201" },
  { city: "Dallas", state: "TX", zip: "75201" },
  { city: "Denver", state: "CO", zip: "80202" },
  { city: "Fort Worth", state: "TX", zip: "76102" },
  { city: "Hackensack", state: "NJ", zip: "07601" },
  { city: "Hartford", state: "CT", zip: "06103" },
  { city: "Houston", state: "TX", zip: "77002" },
  { city: "Indianapolis", state: "IN", zip: "46202" },
  { city: "Jacksonville", state: "FL", zip: "32202" },
  { city: "Jersey City", state: "NJ", zip: "07302" },
  { city: "Los Angeles", state: "CA", zip: "90015" },
  { city: "Miami", state: "FL", zip: "33130" },
  { city: "Nashville", state: "TN", zip: "37203" },
  { city: "New Haven", state: "CT", zip: "06510" },
  { city: "New York", state: "NY", zip: "10001" },
  { city: "Newark", state: "NJ", zip: "07102" },
  { city: "Paramus", state: "NJ", zip: "07652" },
  { city: "Philadelphia", state: "PA", zip: "19103" },
  { city: "Phoenix", state: "AZ", zip: "85004" },
  { city: "Pittsburgh", state: "PA", zip: "15219" },
  { city: "Queens", state: "NY", zip: "11354" },
  { city: "San Antonio", state: "TX", zip: "78205" },
  { city: "San Diego", state: "CA", zip: "92101" },
  { city: "San Francisco", state: "CA", zip: "94103" },
  { city: "San Jose", state: "CA", zip: "95113" },
  { city: "Seattle", state: "WA", zip: "98101" },
  // States with zero coverage from the metro list above — one solid target
  // per state so the directory actually reaches all 50, not just 18.
  { city: "Birmingham", state: "AL", zip: "35203" },
  { city: "Huntsville", state: "AL", zip: "35801" },
  { city: "Anchorage", state: "AK", zip: "99501" },
  { city: "Little Rock", state: "AR", zip: "72201" },
  { city: "Wilmington", state: "DE", zip: "19801" },
  { city: "Honolulu", state: "HI", zip: "96813" },
  { city: "Boise", state: "ID", zip: "83702" },
  { city: "Des Moines", state: "IA", zip: "50309" },
  { city: "Wichita", state: "KS", zip: "67202" },
  { city: "Louisville", state: "KY", zip: "40202" },
  { city: "New Orleans", state: "LA", zip: "70112" },
  { city: "Portland", state: "ME", zip: "04101" },
  { city: "Baltimore", state: "MD", zip: "21201" },
  { city: "Detroit", state: "MI", zip: "48226" },
  { city: "Minneapolis", state: "MN", zip: "55401" },
  { city: "Jackson", state: "MS", zip: "39201" },
  { city: "St. Louis", state: "MO", zip: "63101" },
  { city: "Billings", state: "MT", zip: "59101" },
  { city: "Omaha", state: "NE", zip: "68102" },
  { city: "Las Vegas", state: "NV", zip: "89101" },
  { city: "Manchester", state: "NH", zip: "03101" },
  { city: "Albuquerque", state: "NM", zip: "87102" },
  { city: "Fargo", state: "ND", zip: "58102" },
  { city: "Oklahoma City", state: "OK", zip: "73102" },
  { city: "Tulsa", state: "OK", zip: "74103" },
  { city: "Portland", state: "OR", zip: "97201" },
  { city: "Providence", state: "RI", zip: "02903" },
  { city: "Columbia", state: "SC", zip: "29201" },
  { city: "Sioux Falls", state: "SD", zip: "57104" },
  { city: "Burlington", state: "VT", zip: "05401" },
  { city: "Richmond", state: "VA", zip: "23219" },
  { city: "Charleston", state: "WV", zip: "25301" },
  { city: "Milwaukee", state: "WI", zip: "53202" },
  { city: "Cheyenne", state: "WY", zip: "82001" },
  { city: "Salt Lake City", state: "UT", zip: "84101" },
];

export const VEHICLE_SOURCE = {
  autodev: "autodev",
  catalog: "catalog",
} as const;

export const REVIEW_STATUS = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
} as const;

export type ReviewStatus =
  (typeof REVIEW_STATUS)[keyof typeof REVIEW_STATUS];

export const VISIT_TYPES = [
  "Purchased New Car",
  "Purchased Used Car",
  "Service Visit",
  "Just Looking",
] as const;

export type VisitType = (typeof VISIT_TYPES)[number];

export const REVIEW_SORT = {
  recent: "recent",
  highest: "highest",
  lowest: "lowest",
} as const;

export type ReviewSort = (typeof REVIEW_SORT)[keyof typeof REVIEW_SORT];

/** Minimum seconds the review form must remain open before submit. */
export const REVIEW_MIN_FORM_SECONDS = 5;

/** Max review submissions per IP per hour. */
export const REVIEW_IP_RATE_LIMIT = 3;

export const REVIEW_PAGE_SIZE = 5;
export const ADMIN_REVIEW_PAGE_SIZE = 20;
export const ADMIN_DEALER_PAGE_SIZE = 20;
