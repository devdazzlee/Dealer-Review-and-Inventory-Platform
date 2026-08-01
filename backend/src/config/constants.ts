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

/** Dealer that must appear first in all listings. */
export const PRIORITY_DEALER_SLUG = "bergen-car";

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
