import { toStateSlug } from "@/lib/dealers/state-slugs";
import { env } from "@/config/env";

export const SITE = {
  name: "AutoSalesReviews",
  tagline: "Find your next car from trusted dealerships",
  description:
    "Search thousands of vehicles from trusted, top-rated dealerships across the United States.",
  region: "Nationwide",
  coverage: "Across the United States",
  email: "hello@autosalesreviews.com",
  phone: "(800) 555-0199",
} as const;

/** Google Analytics (gtag.js) — site-wide measurement ID from env. */
export const ANALYTICS = {
  googleMeasurementId: env.googleAnalyticsId,
} as const;

/** Canonical H1 copy, each public page must render exactly one H1 from this map. */
export const PAGE_HEADINGS = {
  home: "Find Your Next Car - Search Trusted Dealerships Nationwide",
  vehicles: "Search Cars for Sale - Browse Thousands of Vehicles Nationwide",
} as const;

export const ROUTES = {
  home: "/",
  vehicles: "/vehicles",
  vehicleDetail: (id: string) => `/vehicles/${id}`,
  compare: "/compare",
  saved: "/saved",
  dealers: "/dealers",
  dealerProfile: (slug: string) => `/dealers/${slug}`,
  dealerState: (stateCode: string) =>
    `/dealers/state/${toStateSlug(stateCode)}`,
  dealerCity: (cityState: string) => `/dealers/city/${cityState}`,
  cities: "/cities",
  about: "/about",
  blog: "/blog",
  blogPost: (slug: string) => `/blog/${slug}`,
  howItWorks: "/how-it-works",
  writeReview: "/write-a-review",
  forDealers: "/for-dealers",
  contact: "/contact",
  faq: "/faq",
  sitemap: "/sitemap",
  accessibility: "/accessibility",
  privacy: "/privacy",
  terms: "/terms",
  cookies: "/cookies",
  admin: "/admin",
  badge: (slug: string) => `/badge/${slug}`,
} as const;

export const NAV_LINKS = [
  // Prefetch off: these routes sit in the fixed nav (always in the viewport),
  // so default Link prefetch would pull their JS on every homepage load and
  // inflate lab TBT. Soft navigation still works without prefetch.
  { href: ROUTES.vehicles, label: "Find Cars", prefetch: false },
  { href: ROUTES.dealers, label: "Dealers", prefetch: false },
  { href: ROUTES.blog, label: "Blog", prefetch: false },
  // About's page content still uses framer-motion for its own entrance
  // animations. This link sits in the fixed navbar, visible without any
  // scroll, so Next.js's viewport-based Link prefetch fetches that weight
  // on every single page load. prefetch:false stops that; the tradeoff is
  // a normal (non-prefetched) navigation on the rare click into About.
  { href: ROUTES.about, label: "About", prefetch: false },
] as const;

export const FOOTER = {
  explore: [
    { href: ROUTES.vehicles, label: "Find Cars" },
    { href: ROUTES.saved, label: "Saved Vehicles" },
    { href: ROUTES.dealers, label: "Dealers" },
    { href: ROUTES.cities, label: "Cities" },
    { href: ROUTES.blog, label: "Blog" },
    { href: `${ROUTES.vehicles}?bodyStyle=SUV`, label: "Browse SUVs" },
    { href: `${ROUTES.vehicles}?condition=NEW`, label: "New Vehicles" },
  ],
  support: [
    { href: ROUTES.contact, label: "Contact Us" },
    { href: ROUTES.faq, label: "FAQ" },
    { href: ROUTES.forDealers, label: "List Your Dealership" },
    { href: ROUTES.accessibility, label: "Accessibility" },
  ],
  company: [
    { href: ROUTES.about, label: "About Us" },
    { href: ROUTES.howItWorks, label: "How It Works" },
    { href: ROUTES.writeReview, label: "Write a Review" },
    { href: ROUTES.forDealers, label: "For Dealers" },
  ],
  legal: [
    { href: ROUTES.privacy, label: "Privacy Policy" },
    { href: ROUTES.terms, label: "Terms of Service" },
    { href: ROUTES.cookies, label: "Cookie Policy" },
    { href: ROUTES.sitemap, label: "Sitemap" },
  ],
} as const;

export const HOW_IT_WORKS_STEPS = [
  {
    step: "01",
    title: "Search vehicles",
    description:
      "Filter thousands of cars by make, model, price, mileage, and body style from dealerships across the country.",
  },
  {
    step: "02",
    title: "Compare dealers",
    description:
      "Every vehicle shows its dealer's combined Google rating plus their Yelp score so you can buy with confidence.",
  },
  {
    step: "03",
    title: "Contact & drive",
    description:
      "Reach out to the dealer, schedule a test drive, and pick up your next car, all from one place.",
  },
] as const;

export const WHY_CHOOSE_US = [
  {
    title: "Real inventory",
    description:
      "Browse actual vehicles for sale with prices, mileage, and features, not just dealer listings.",
  },
  {
    title: "Combined ratings",
    description:
      "We combine Google ratings with our own verified reviews into one trusted score, and show each dealer's Yelp rating alongside it.",
  },
  {
    title: "Nationwide reach",
    description:
      "Search dealerships in all 50 states, so you can shop locally or expand your search anywhere.",
  },
  {
    title: "Built for buyers",
    description:
      "Fast search, clear vehicle pages, and mobile-friendly browsing designed for real car shopping.",
  },
] as const;

export const TESTIMONIALS = [
  {
    quote:
      "Found the exact SUV I wanted within minutes. The combined rating told me the dealership was legit before I even called.",
    name: "Michael R.",
    location: "Verified buyer",
    rating: 5,
  },
  {
    quote:
      "Being able to filter by price and mileage and still see dealer reviews saved me a wasted Saturday and a bad deal.",
    name: "Priya S.",
    location: "Verified buyer",
    rating: 5,
  },
  {
    quote:
      "Simple, honest, no clutter. I compared three cars from three dealers side by side and picked the best one.",
    name: "Daniel K.",
    location: "Verified buyer",
    rating: 4,
  },
] as const;

export const FAQS = [
  {
    question: "Is AutoSalesReviews free to use?",
    answer:
      "Yes. Searching vehicles, reading reviews, and comparing dealer ratings is completely free for car buyers, with no account required.",
  },
  {
    question: "How are dealer ratings calculated?",
    answer:
      "We combine Google ratings with our own verified customer reviews into a single average score, and show each dealer's Yelp rating alongside it, so you get the full picture at a glance.",
  },
  {
    question: "Which areas do you cover?",
    answer:
      "We cover dealerships nationwide, across all 50 states. Filter by state or city to find inventory near you, or search anywhere in the country.",
  },
  {
    question: "Can a dealership remove a negative review?",
    answer:
      "No. Dealers can respond publicly to reviews, but they cannot delete or suppress honest feedback from verified buyers.",
  },
  {
    question: "How do I contact a dealer about a car?",
    answer:
      "Open any vehicle page and use \"Contact Dealer About This Car\" or \"Schedule a Test Drive\" to reach the dealership directly.",
  },
] as const;

/** All 50 US states plus DC. */
export const STATES = [
  { code: "AL", label: "Alabama" },
  { code: "AK", label: "Alaska" },
  { code: "AZ", label: "Arizona" },
  { code: "AR", label: "Arkansas" },
  { code: "CA", label: "California" },
  { code: "CO", label: "Colorado" },
  { code: "CT", label: "Connecticut" },
  { code: "DE", label: "Delaware" },
  { code: "DC", label: "District of Columbia" },
  { code: "FL", label: "Florida" },
  { code: "GA", label: "Georgia" },
  { code: "HI", label: "Hawaii" },
  { code: "ID", label: "Idaho" },
  { code: "IL", label: "Illinois" },
  { code: "IN", label: "Indiana" },
  { code: "IA", label: "Iowa" },
  { code: "KS", label: "Kansas" },
  { code: "KY", label: "Kentucky" },
  { code: "LA", label: "Louisiana" },
  { code: "ME", label: "Maine" },
  { code: "MD", label: "Maryland" },
  { code: "MA", label: "Massachusetts" },
  { code: "MI", label: "Michigan" },
  { code: "MN", label: "Minnesota" },
  { code: "MS", label: "Mississippi" },
  { code: "MO", label: "Missouri" },
  { code: "MT", label: "Montana" },
  { code: "NE", label: "Nebraska" },
  { code: "NV", label: "Nevada" },
  { code: "NH", label: "New Hampshire" },
  { code: "NJ", label: "New Jersey" },
  { code: "NM", label: "New Mexico" },
  { code: "NY", label: "New York" },
  { code: "NC", label: "North Carolina" },
  { code: "ND", label: "North Dakota" },
  { code: "OH", label: "Ohio" },
  { code: "OK", label: "Oklahoma" },
  { code: "OR", label: "Oregon" },
  { code: "PA", label: "Pennsylvania" },
  { code: "RI", label: "Rhode Island" },
  { code: "SC", label: "South Carolina" },
  { code: "SD", label: "South Dakota" },
  { code: "TN", label: "Tennessee" },
  { code: "TX", label: "Texas" },
  { code: "UT", label: "Utah" },
  { code: "VT", label: "Vermont" },
  { code: "VA", label: "Virginia" },
  { code: "WA", label: "Washington" },
  { code: "WV", label: "West Virginia" },
  { code: "WI", label: "Wisconsin" },
  { code: "WY", label: "Wyoming" },
] as const;

export const STATE_LABELS: Record<string, string> = Object.fromEntries(
  STATES.map((s) => [s.code, s.label])
);

/** Broad US regions used for browsing dealers nationwide. */
export const REGIONS = [
  {
    key: "northeast",
    label: "Northeast",
    blurb: "NY, NJ, PA, New England",
    states: [
      "CT", "ME", "MA", "NH", "NJ", "NY", "PA", "RI", "VT", "DE", "MD", "DC",
    ],
  },
  {
    key: "southeast",
    label: "Southeast",
    blurb: "FL, GA, the Carolinas",
    states: [
      "AL", "AR", "FL", "GA", "KY", "LA", "MS", "NC", "SC", "TN", "VA", "WV",
    ],
  },
  {
    key: "midwest",
    label: "Midwest",
    blurb: "IL, MI, OH, the Plains",
    states: [
      "IA", "IL", "IN", "KS", "MI", "MN", "MO", "ND", "NE", "OH", "SD", "WI",
    ],
  },
  {
    key: "southwest",
    label: "Southwest",
    blurb: "TX, AZ, NM, OK",
    states: ["AZ", "NM", "OK", "TX"],
  },
  {
    key: "west",
    label: "West",
    blurb: "CA, WA, CO, the Mountain West",
    states: ["AK", "CA", "CO", "HI", "ID", "MT", "NV", "OR", "UT", "WA", "WY"],
  },
] as const;

export type RegionKey = (typeof REGIONS)[number]["key"];

export function getRegion(key?: string) {
  return REGIONS.find((r) => r.key === key);
}

export const MIN_RATING_OPTIONS = [
  { value: "any", label: "Any Rating" },
  { value: "4", label: "4+ Stars" },
  { value: "3", label: "3+ Stars" },
  { value: "2", label: "2+ Stars" },
] as const;

export const API = {
  revalidateSeconds: 60,
} as const;
