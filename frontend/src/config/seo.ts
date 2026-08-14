import type { Metadata } from "next";
import type { ArticleBlock, BlogPost } from "@/config/blog";
import { blockToPlainText } from "@/config/blog";
import { ROUTES, SITE } from "@/config/constants";
import type { VehicleCategoryConfig } from "@/config/vehicle-categories";
import { vehicleCategoryHref } from "@/config/vehicle-categories";
import { getCanonicalUrl, getSiteUrl, withCanonical } from "@/lib/seo";
import type { Vehicle } from "@/types/vehicle";

const META_DESCRIPTION_MAX = 155;

/** Default indexable robots directives for all public marketing pages. */
export const INDEXABLE_ROBOTS: NonNullable<Metadata["robots"]> = {
  index: true,
  follow: true,
  googleBot: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
    "max-video-preview": -1,
  },
};

/** Homepage-only keywords. Must not repeat on any other page. */
export const HOME_KEYWORDS = [
  "find trusted car dealerships nationwide",
  "AutoSalesReviews car search platform",
  "compare dealer ratings across the US",
  "nationwide vehicle marketplace",
  "shop cars from rated dealers",
  "verified auto dealer directory",
  "buy your next car with confidence",
] as const;

/**
 * Static page keywords — each phrase appears on exactly one page.
 * Do not reuse phrases across pages or in dynamic keyword builders.
 */
export const PAGE_KEYWORDS = {
  vehicles: [
    "browse cars for sale nationwide",
    "filter vehicles by make and model",
    "new and used car inventory search",
    "compare car prices nationwide",
    "search vehicles by price and year",
    "nationwide auto inventory listings",
    "find cars by body style and mileage",
  ],
  dealers: [
    "find car dealerships near you",
    "compare local auto dealers",
    "dealership directory by state",
    "Google Yelp Carfax dealer ratings",
    "read verified dealership reviews",
    "locate top-rated car dealers",
    "dealer profiles with live inventory",
  ],
  blog: [
    "AutoSalesReviews buying guides",
    "expert car shopping articles",
    "automotive news and tips blog",
    "used car buying guide articles",
    "financing and trade-in advice blog",
    "test drive checklist articles",
    "EV SUV and sedan roundups",
  ],
  about: [
    "AutoSalesReviews company mission",
    "how we verify dealer reviews",
    "transparent car shopping platform",
    "nationwide dealer review standards",
    "who we are AutoSalesReviews",
    "trusted auto marketplace story",
    "our commitment to honest ratings",
  ],
  contact: [
    "reach AutoSalesReviews support",
    "contact our car search team",
    "dealership listing inquiries",
    "report inaccurate vehicle listing",
    "buyer help desk AutoSalesReviews",
    "partner with AutoSalesReviews",
    "email AutoSalesReviews team",
  ],
  forDealers: [
    "advertise your dealership online",
    "get more car buyer leads",
    "dealership profile listing signup",
    "automotive digital marketing platform",
    "showcase inventory to motivated buyers",
    "build reputation with customer reviews",
    "AutoSalesReviews dealer onboarding",
  ],
  writeReview: [
    "submit your dealership experience",
    "rate your car buying visit",
    "share auto dealer feedback",
    "help other buyers choose dealers",
    "post honest dealership review",
    "tell us about your dealer visit",
  ],
  faq: [
    "AutoSalesReviews help center",
    "common car buying questions answered",
    "how dealer ratings are calculated",
    "vehicle search troubleshooting guide",
    "listing and review policies explained",
    "platform usage questions and answers",
  ],
  howItWorks: [
    "three steps to find your next car",
    "search compare buy workflow guide",
    "how to use dealer rating filters",
    "filter inventory by make and price",
    "schedule a test drive walkthrough",
    "compare dealerships before you buy",
  ],
  privacy: [
    "AutoSalesReviews privacy policy",
    "how we handle personal data",
    "information collection practices",
    "data retention and security policy",
    "your privacy rights explained",
  ],
  terms: [
    "AutoSalesReviews terms of service",
    "platform usage agreement",
    "user responsibilities and rules",
    "dealer listing terms and conditions",
    "acceptable use policy AutoSalesReviews",
  ],
  cookies: [
    "AutoSalesReviews cookie policy",
    "how we use website cookies",
    "analytics and tracking disclosure",
    "manage cookie preferences",
    "third-party cookie information",
  ],
  accessibility: [
    "AutoSalesReviews accessibility statement",
    "WCAG compliance commitment",
    "accessible car search experience",
    "request accessibility accommodation",
    "screen reader friendly navigation",
  ],
  sitemap: [
    "AutoSalesReviews HTML sitemap",
    "browse all site sections",
    "full page directory car search",
    "dealer and vehicle page index",
    "navigate AutoSalesReviews site map",
  ],
  cities: [
    "car dealers by city directory",
    "browse dealerships by metro area",
    "local auto dealer city listings",
    "find dealers in major US cities",
    "city-by-city dealership index",
    "metro area car dealer guide",
  ],
  notFound: [
    "page not found AutoSalesReviews",
    "missing vehicle or dealer page",
    "return to car search homepage",
    "404 error AutoSalesReviews",
  ],
} as const;

interface PageMetadataOptions {
  keywords?: string[];
  image?: string;
}

function socialImageUrl(image?: string): string {
  if (!image) return getCanonicalUrl("/blog/new-vs-used-vs-cpo.webp");
  if (image.startsWith("http://") || image.startsWith("https://")) return image;
  return getCanonicalUrl(image);
}

function buildSocialMetadata(
  title: string,
  description: string,
  canonical: string,
  image?: string
): Pick<Metadata, "openGraph" | "twitter"> {
  const ogImage = socialImageUrl(image);
  return {
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE.name,
      type: "website",
      locale: "en_US",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

/** Sets title, description, canonical, robots, Open Graph, Twitter, and publisher meta. */
export function createPageMetadata(
  title: string,
  description: string,
  path: string,
  options: PageMetadataOptions = {}
): Metadata {
  const canonical = getCanonicalUrl(path);

  return withCanonical(
    {
      title: { absolute: title },
      description,
      robots: INDEXABLE_ROBOTS,
      ...buildSocialMetadata(title, description, canonical, options.image),
      ...(options.keywords ? { keywords: options.keywords } : {}),
      other: {
        publisher: SITE.name,
      },
    },
    path
  );
}

export function truncateDescription(
  text: string,
  maxLength = META_DESCRIPTION_MAX
): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;

  const truncated = normalized.slice(0, maxLength);
  const lastSpace = truncated.lastIndexOf(" ");
  const slice = lastSpace > 0 ? truncated.slice(0, lastSpace) : truncated;
  return `${slice.trim()}…`;
}

function plainTextFromBlocks(blocks: ArticleBlock[]): string {
  return blocks.map(blockToPlainText).join(" ");
}

function blogPostPlainText(post: BlogPost): string {
  return plainTextFromBlocks(post.body) || post.excerpt;
}

const KEYWORD_STOP_WORDS = new Set([
  "about",
  "after",
  "also",
  "been",
  "from",
  "have",
  "help",
  "here",
  "into",
  "just",
  "more",
  "most",
  "need",
  "only",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "this",
  "what",
  "when",
  "with",
  "your",
  "guide",
]);

/** Builds keywords unique to a single blog post from its slug, category, and title. */
function buildBlogPostKeywords(post: BlogPost): string[] {
  const slugPhrase = post.slug.replace(/-/g, " ");
  const titleWords = post.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((word) => word.length > 3 && !KEYWORD_STOP_WORDS.has(word));

  return Array.from(new Set([slugPhrase, post.category, ...titleWords])).slice(
    0,
    8
  );
}

/** Builds keywords unique to a single vehicle listing. */
function buildVehicleKeywords(vehicle: Vehicle): string[] {
  const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  return [
    label,
    `${vehicle.make} ${vehicle.model} for sale ${vehicle.dealer.city}`,
    `${vehicle.bodyStyle} ${vehicle.condition} ${vehicle.dealer.state}`,
    `${vehicle.trim} ${vehicle.year} ${vehicle.make}`,
    `${vehicle.dealer.city} ${vehicle.dealer.state} ${vehicle.make}`,
  ];
}

/** Builds keywords unique to a single dealership profile. */
function buildDealerKeywords(dealer: {
  name: string;
  city: string;
  state: string;
}): string[] {
  return [
    `${dealer.name} ${dealer.city} ${dealer.state}`,
    `${dealer.name} dealership reviews`,
    `${dealer.name} inventory ${dealer.city}`,
    `used cars ${dealer.city} ${dealer.state}`,
    `buy a car at ${dealer.name}`,
  ];
}

export const PAGE_SEO = {
  home: createPageMetadata(
    "AutoSalesReviews - Find Trusted Car Dealerships Nationwide",
    "Search thousands of vehicles from trusted dealerships across the United States. Read real customer reviews, compare ratings and find your next car.",
    ROUTES.home,
    { keywords: [...HOME_KEYWORDS] }
  ),
  vehicles: createPageMetadata(
    "Search Cars for Sale Nationwide | AutoSalesReviews",
    "Browse thousands of new and used cars for sale from verified dealerships across the US. Filter by make, model, year, price and more.",
    ROUTES.vehicles,
    { keywords: [...PAGE_KEYWORDS.vehicles] }
  ),
  dealers: createPageMetadata(
    "Find Car Dealerships Near You | AutoSalesReviews",
    "Browse trusted car dealerships nationwide. Read verified customer reviews, compare Google Yelp and Carfax ratings and find the best dealer near you.",
    ROUTES.dealers,
    { keywords: [...PAGE_KEYWORDS.dealers] }
  ),
  blog: createPageMetadata(
    "Car Buying Tips and Dealer News | AutoSalesReviews Blog",
    "Expert advice on buying cars, finding trusted dealers and navigating the auto industry. Tips, guides and news for smart car buyers.",
    ROUTES.blog,
    { keywords: [...PAGE_KEYWORDS.blog] }
  ),
  about: createPageMetadata(
    "About AutoSalesReviews | Trusted Auto Dealer Reviews",
    "AutoSalesReviews is the trusted source for real car dealer reviews and vehicle listings nationwide. Learn about our mission and how we verify reviews.",
    ROUTES.about,
    { keywords: [...PAGE_KEYWORDS.about] }
  ),
  contact: createPageMetadata(
    "Contact AutoSalesReviews | Get in Touch",
    "Have a question or need help? Contact the AutoSalesReviews team. We are here to help car buyers and dealerships alike.",
    ROUTES.contact,
    { keywords: [...PAGE_KEYWORDS.contact] }
  ),
  forDealers: createPageMetadata(
    "List Your Dealership | AutoSalesReviews for Dealers",
    "Reach thousands of motivated car buyers nationwide. List your dealership on AutoSalesReviews and build trust with real customer reviews.",
    ROUTES.forDealers,
    { keywords: [...PAGE_KEYWORDS.forDealers] }
  ),
  writeReview: createPageMetadata(
    "Write a Dealer Review | AutoSalesReviews",
    "Share your car dealership experience and help other buyers make smarter decisions.",
    ROUTES.writeReview,
    { keywords: [...PAGE_KEYWORDS.writeReview] }
  ),
  faq: createPageMetadata(
    "Frequently Asked Questions | AutoSalesReviews",
    "Get answers about searching cars, reading dealer ratings, writing reviews, and listing your dealership on AutoSalesReviews.",
    ROUTES.faq,
    { keywords: [...PAGE_KEYWORDS.faq] }
  ),
  howItWorks: createPageMetadata(
    "How AutoSalesReviews Works | Search, Compare, Buy",
    "Learn how to search vehicles, compare dealer ratings from Google Yelp and Carfax, and buy with confidence on AutoSalesReviews.",
    ROUTES.howItWorks,
    { keywords: [...PAGE_KEYWORDS.howItWorks] }
  ),
  privacy: createPageMetadata(
    "Privacy Policy | AutoSalesReviews",
    "Read how AutoSalesReviews collects, uses, and protects your personal information when you search cars or submit dealer reviews.",
    ROUTES.privacy,
    { keywords: [...PAGE_KEYWORDS.privacy] }
  ),
  terms: createPageMetadata(
    "Terms of Service | AutoSalesReviews",
    "Review the terms and conditions for using AutoSalesReviews to search vehicles, read dealer reviews, and list your dealership.",
    ROUTES.terms,
    { keywords: [...PAGE_KEYWORDS.terms] }
  ),
  cookies: createPageMetadata(
    "Cookie Policy | AutoSalesReviews",
    "Learn how AutoSalesReviews uses cookies and similar technologies to improve your experience on our car search platform.",
    ROUTES.cookies,
    { keywords: [...PAGE_KEYWORDS.cookies] }
  ),
  accessibility: createPageMetadata(
    "Accessibility Statement | AutoSalesReviews",
    "AutoSalesReviews is committed to making car search and dealer reviews accessible to everyone. Read our accessibility standards and contact us.",
    ROUTES.accessibility,
    { keywords: [...PAGE_KEYWORDS.accessibility] }
  ),
  sitemap: createPageMetadata(
    "Sitemap | AutoSalesReviews",
    "Browse every section of AutoSalesReviews, vehicle search, dealer profiles, buying guides, and support pages.",
    ROUTES.sitemap,
    { keywords: [...PAGE_KEYWORDS.sitemap] }
  ),
} as const;

/** Category pages use query-string canonicals (e.g. /vehicles?bodyStyle=SUV). */
export function buildVehicleCategoryMetadata(
  category: VehicleCategoryConfig
): Metadata {
  const path = vehicleCategoryHref(category.key);
  const canonical = `${getSiteUrl()}${path}`;

  return {
    title: { absolute: category.metaTitle },
    description: category.metaDescription,
    robots: INDEXABLE_ROBOTS,
    ...buildSocialMetadata(category.metaTitle, category.metaDescription, canonical),
    alternates: { canonical },
    keywords: category.keywords,
    other: {
      publisher: SITE.name,
    },
  };
}

export function buildVehicleMetadata(vehicle: Vehicle): Metadata {
  const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  return createPageMetadata(
    `${label} for Sale | AutoSalesReviews`,
    `View details, photos and specs for this ${label}. Contact the dealer and schedule a test drive today.`,
    ROUTES.vehicleDetail(vehicle.id),
    {
      keywords: buildVehicleKeywords(vehicle),
      image: vehicle.photos?.[0],
    }
  );
}

export function buildDealerProfileMetadata(dealer: {
  name: string;
  slug: string;
  city: string;
  state: string;
}): Metadata {
  return createPageMetadata(
    `${dealer.name} Reviews and Inventory | AutoSalesReviews`,
    `Read customer reviews for ${dealer.name} in ${dealer.city}, ${dealer.state}. View inventory, ratings, contact info, and business hours.`,
    ROUTES.dealerProfile(dealer.slug),
    { keywords: buildDealerKeywords(dealer) }
  );
}

export function buildBlogPostMetadata(post: BlogPost): Metadata {
  const title = post.metaTitle || `${post.title} | AutoSalesReviews Blog`;
  const description = post.metaDescription || truncateDescription(blogPostPlainText(post));
  return createPageMetadata(
    title,
    description,
    ROUTES.blogPost(post.slug),
    {
      keywords: buildBlogPostKeywords(post),
      image: post.featuredImageUrl,
    }
  );
}

export function buildCityPageMetadata(
  title: string,
  description: string,
  path: string,
  city: string,
  stateCode: string
): Metadata {
  return createPageMetadata(title, description, path, {
    keywords: [
      `${city} ${stateCode} car dealers`,
      `dealerships in ${city} ${stateCode}`,
      `buy a car in ${city} ${stateCode}`,
      `${city} auto dealer directory`,
      `used and new cars ${city} ${stateCode}`,
    ],
  });
}

export function buildStatePageMetadata(
  title: string,
  description: string,
  path: string,
  stateName: string
): Metadata {
  return createPageMetadata(title, description, path, {
    keywords: [
      `${stateName} car dealerships directory`,
      `auto dealers throughout ${stateName}`,
      `buy a car in ${stateName}`,
      `${stateName} dealership listings by city`,
      `find dealers across ${stateName}`,
    ],
  });
}

export function buildNotFoundMetadata(entity: string): Metadata {
  return createPageMetadata(
    `${entity} Not Found | AutoSalesReviews`,
    `The ${entity.toLowerCase()} that you are looking for could not be found. Search cars and dealers on ${SITE.name}.`,
    ROUTES.home,
    { keywords: [...PAGE_KEYWORDS.notFound] }
  );
}
