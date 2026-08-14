import type { ArticleBlock } from "@/config/blog";
import type { BlogPost } from "@/config/blog";
import { countArticleWords } from "@/config/blog";
import type { TargetCity } from "@/config/locations/cities-data";
import { TARGET_CITIES } from "@/config/locations/cities-data";
import { HOW_IT_WORKS_STEPS, ROUTES, SITE } from "@/config/constants";
import {
  vehicleCategoryHref,
  type VehicleCategoryConfig,
} from "@/config/vehicle-categories";
import { getCanonicalUrl } from "@/lib/seo";
import type { DealerDetail } from "@/types/dealer";
import type { DealerRatings, Vehicle } from "@/types/vehicle";
import type { FaqItem, JsonLd } from "@/lib/schema/types";
import { SCHEMA_CONTEXT } from "@/lib/schema/types";
import { getStateLabel } from "@/lib/dealers/state-slugs";

function withContext(schema: JsonLd): JsonLd {
  return { "@context": SCHEMA_CONTEXT, ...schema };
}

/** Combines multiple schemas into one JSON-LD document using @graph. */
export function buildSchemaGraph(schemas: JsonLd[]): JsonLd {
  if (schemas.length === 0) {
    return { "@context": SCHEMA_CONTEXT };
  }
  if (schemas.length === 1) {
    return withContext(schemas[0]);
  }
  return {
    "@context": SCHEMA_CONTEXT,
    "@graph": schemas,
  };
}

export function buildOrganizationSchema(): JsonLd {
  return {
    "@type": "Organization",
    name: SITE.name,
    url: getCanonicalUrl(ROUTES.home),
    description: SITE.description,
    logo: getCanonicalUrl("/favicon.ico"),
    email: SITE.email,
    telephone: SITE.phone,
    areaServed: SITE.coverage,
  };
}

export function buildWebSiteSchema(): JsonLd {
  return {
    "@type": "WebSite",
    name: SITE.name,
    url: getCanonicalUrl(ROUTES.home),
    description: SITE.description,
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: getCanonicalUrl(ROUTES.home),
    },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${getCanonicalUrl(ROUTES.vehicles)}?search={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildAutoDealerSchema(
  dealer: DealerDetail,
  ratings: DealerRatings
): JsonLd {
  return {
    "@type": ["AutoDealer", "LocalBusiness"],
    name: dealer.name,
    url: getCanonicalUrl(ROUTES.dealerProfile(dealer.slug)),
    description:
      dealer.description ??
      `${dealer.name} is a trusted car dealership in ${dealer.city}, ${dealer.state}.`,
    telephone: dealer.phone ?? undefined,
    ...(dealer.website ? { sameAs: dealer.website } : {}),
    address: {
      "@type": "PostalAddress",
      streetAddress: dealer.address,
      addressLocality: dealer.city,
      addressRegion: dealer.state,
      postalCode: dealer.zip,
      addressCountry: "US",
    },
    aggregateRating:
      ratings.combined != null && ratings.totalReviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: ratings.combined,
            reviewCount: ratings.totalReviews,
            bestRating: 5,
            worstRating: 1,
          }
        : undefined,
  };
}

export function parseBlogDate(date: string): string {
  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }
  return date;
}

export function buildArticleSchema(post: BlogPost): JsonLd {
  return {
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: parseBlogDate(post.date),
    wordCount: countArticleWords(post.body),
    keywords: post.targetKeyword,
    author: {
      "@type": "Person",
      name: post.author,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: getCanonicalUrl(ROUTES.home),
      logo: {
        "@type": "ImageObject",
        url: getCanonicalUrl("/favicon.ico"),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": getCanonicalUrl(ROUTES.blogPost(post.slug)),
    },
    image: getCanonicalUrl(`/blog/${post.slug}.jpg`),
    articleSection: post.category,
  };
}

/** Extracts FAQ pairs from explicit FAQ blocks in article body. */
export function extractArticleFaqs(blocks: ArticleBlock[]): FaqItem[] {
  const faqs: FaqItem[] = [];

  for (const block of blocks) {
    if (block.type === "faq") {
      faqs.push(...block.items);
    }
  }

  return faqs;
}

export function buildFaqPageSchema(faqs: FaqItem[]): JsonLd | null {
  if (faqs.length === 0) return null;

  return {
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildContactPageSchema(): JsonLd {
  return {
    "@type": "ContactPage",
    name: `Contact ${SITE.name}`,
    url: getCanonicalUrl(ROUTES.contact),
    description:
      "Contact AutoSalesReviews for help with vehicle search, dealer reviews, or dealership listings.",
    mainEntity: {
      "@type": "Organization",
      name: SITE.name,
      url: getCanonicalUrl(ROUTES.home),
      email: SITE.email,
      telephone: SITE.phone,
    },
  };
}

export function buildAboutPageSchema(): JsonLd {
  return {
    "@type": "AboutPage",
    name: `About ${SITE.name}`,
    url: getCanonicalUrl(ROUTES.about),
    description:
      "Learn about AutoSalesReviews, the trusted source for real car dealer reviews and vehicle listings nationwide.",
    mainEntity: {
      "@type": "Organization",
      name: SITE.name,
      url: getCanonicalUrl(ROUTES.home),
      description: SITE.description,
      email: SITE.email,
      telephone: SITE.phone,
      logo: getCanonicalUrl("/favicon.ico"),
      areaServed: SITE.coverage,
    },
  };
}

export function buildDealerListingServiceSchema(): JsonLd {
  return {
    "@type": "Service",
    name: "Dealership Listing & Review Platform",
    url: getCanonicalUrl(ROUTES.forDealers),
    provider: {
      "@type": "Organization",
      name: SITE.name,
      url: getCanonicalUrl(ROUTES.home),
    },
    serviceType: "Automotive dealer marketing and reputation management",
    areaServed: {
      "@type": "Country",
      name: "United States",
    },
    description:
      "List your dealership on AutoSalesReviews to reach motivated car buyers, showcase inventory, and build trust with verified customer reviews.",
  };
}

export function buildCarSchema(vehicle: Vehicle): JsonLd {
  const name = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`.trim();
  const images =
    (vehicle.photos?.length ?? 0) > 0
      ? vehicle.photos!.map((src) =>
          src.startsWith("http") ? src : getCanonicalUrl(src)
        )
      : [];
  const validUntil = new Date();
  validUntil.setDate(validUntil.getDate() + 30);

  return {
    "@type": "Car",
    name,
    description: vehicle.description,
    image: images,
    brand: { "@type": "Brand", name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: vehicle.mileage,
      unitCode: "SMI",
    },
    color: vehicle.exteriorColor || undefined,
    vehicleIdentificationNumber: vehicle.vin,
    itemCondition:
      vehicle.condition === "NEW"
        ? "https://schema.org/NewCondition"
        : "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "USD",
      priceValidUntil: validUntil.toISOString().split("T")[0],
      availability: "https://schema.org/InStock",
      url: getCanonicalUrl(ROUTES.vehicleDetail(vehicle.id)),
      seller: {
        "@type": "AutoDealer",
        name: vehicle.dealer.name,
        url: getCanonicalUrl(ROUTES.dealerProfile(vehicle.dealer.slug)),
      },
    },
  };
}

export function buildProductSchema(vehicle: Vehicle): JsonLd {
  return buildCarSchema(vehicle);
}

export function buildBlogCategorySchema(post: BlogPost): JsonLd {
  return {
    "@type": "CollectionPage",
    name: `${post.category} | ${SITE.name} Blog`,
    url: getCanonicalUrl(ROUTES.blogPost(post.slug)),
    about: {
      "@type": "Thing",
      name: post.category,
    },
  };
}

export interface BreadcrumbItem {
  name: string;
  path: string;
}

export function buildBreadcrumbSchema(items: BreadcrumbItem[]): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: getCanonicalUrl(item.path),
    })),
  };
}

/** City landing page LocalBusiness schema representing the market page. */
export function buildCityLocalBusinessSchema(target: TargetCity): JsonLd {
  const stateName = getStateLabel(target.stateCode);
  return {
    "@type": ["LocalBusiness", "AutoDealer"],
    name: `Car Dealerships in ${target.city}, ${stateName}`,
    description: `Directory of trusted car dealerships in ${target.city}, ${stateName} with verified reviews and inventory on ${SITE.name}.`,
    url: getCanonicalUrl(ROUTES.dealerCity(target.slug)),
    areaServed: {
      "@type": "City",
      name: target.city,
      containedInPlace: {
        "@type": "State",
        name: stateName,
      },
    },
    parentOrganization: {
      "@type": "Organization",
      name: SITE.name,
      url: getCanonicalUrl(ROUTES.home),
    },
  };
}

export function buildCityPageSchemas(
  target: TargetCity,
  faqs: FaqItem[]
): JsonLd[] {
  const stateName = getStateLabel(target.stateCode);
  const breadcrumbs = buildBreadcrumbSchema([
    { name: "Home", path: ROUTES.home },
    { name: "Dealers", path: ROUTES.dealers },
    { name: stateName, path: ROUTES.dealerState(target.stateCode) },
    {
      name: target.city,
      path: ROUTES.dealerCity(target.slug),
    },
  ]);

  const faqSchema = buildFaqPageSchema(faqs);
  return [
    buildCityLocalBusinessSchema(target),
    breadcrumbs,
    ...(faqSchema ? [faqSchema] : []),
  ];
}

export function buildStatePageSchemas(
  stateCode: string,
  faqs: FaqItem[]
): JsonLd[] {
  const stateName = getStateLabel(stateCode);
  const breadcrumbs = buildBreadcrumbSchema([
    { name: "Home", path: ROUTES.home },
    { name: "Dealers", path: ROUTES.dealers },
    { name: stateName, path: ROUTES.dealerState(stateCode) },
  ]);
  const faqSchema = buildFaqPageSchema(faqs);
  return [breadcrumbs, ...(faqSchema ? [faqSchema] : [])];
}

export function buildWebPageSchema(
  name: string,
  description: string,
  path: string
): JsonLd {
  return {
    "@type": "WebPage",
    name,
    description,
    url: getCanonicalUrl(path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE.name,
      url: getCanonicalUrl(ROUTES.home),
    },
  };
}

export function buildCollectionPageSchema(
  name: string,
  description: string,
  path: string
): JsonLd {
  return {
    "@type": "CollectionPage",
    name,
    description,
    url: getCanonicalUrl(path),
    isPartOf: {
      "@type": "WebSite",
      name: SITE.name,
      url: getCanonicalUrl(ROUTES.home),
    },
  };
}

export function buildItemListSchema(
  name: string,
  items: { name: string; url: string }[]
): JsonLd {
  return {
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

interface ListingPageSchemaInput {
  collectionName: string;
  collectionDescription: string;
  path: string;
  listName?: string;
  listItems?: { name: string; url: string }[];
  faqs?: FaqItem[];
  breadcrumbs?: BreadcrumbItem[];
}

/** Builds CollectionPage plus optional ItemList, FAQPage, and BreadcrumbList schemas. */
export function buildListingPageSchemas(
  input: ListingPageSchemaInput
): JsonLd[] {
  const schemas: JsonLd[] = [
    buildCollectionPageSchema(
      input.collectionName,
      input.collectionDescription,
      input.path
    ),
  ];

  if (input.breadcrumbs && input.breadcrumbs.length > 0) {
    schemas.push(buildBreadcrumbSchema(input.breadcrumbs));
  }

  if (input.listItems && input.listItems.length > 0) {
    schemas.push(
      buildItemListSchema(
        input.listName ?? input.collectionName,
        input.listItems
      )
    );
  }

  const faqSchema = input.faqs ? buildFaqPageSchema(input.faqs) : null;
  if (faqSchema) {
    schemas.push(faqSchema);
  }

  return schemas;
}

export function buildDealersListingSchemas(faqs?: FaqItem[]): JsonLd[] {
  return buildListingPageSchemas({
    collectionName: "Find Car Dealerships Nationwide",
    collectionDescription:
      "Browse trusted car dealerships across the United States with verified Google, Yelp, and Carfax ratings.",
    path: ROUTES.dealers,
    faqs,
    breadcrumbs: [
      { name: "Home", path: ROUTES.home },
      { name: "Dealers", path: ROUTES.dealers },
    ],
  });
}

export function buildVehiclesListingSchemas(options: {
  path: string;
  collectionName: string;
  collectionDescription: string;
  listItems: { name: string; url: string }[];
  faqs?: FaqItem[];
  breadcrumbs?: BreadcrumbItem[];
}): JsonLd[] {
  return buildListingPageSchemas({
    collectionName: options.collectionName,
    collectionDescription: options.collectionDescription,
    path: options.path,
    listName: `${options.collectionName} inventory`,
    listItems: options.listItems,
    faqs: options.faqs,
    breadcrumbs: options.breadcrumbs,
  });
}

export function buildVehicleCategorySchemas(
  category: VehicleCategoryConfig,
  listItems: { name: string; url: string }[]
): JsonLd[] {
  return buildVehiclesListingSchemas({
    path: vehicleCategoryHref(category.key),
    collectionName: category.metaTitle.replace(` | ${SITE.name}`, ""),
    collectionDescription: category.metaDescription,
    listItems,
    faqs: category.faqs,
    breadcrumbs: [
      { name: "Home", path: ROUTES.home },
      { name: "Vehicles", path: ROUTES.vehicles },
      { name: category.label, path: vehicleCategoryHref(category.key) },
    ],
  });
}

export function buildBlogListingSchemas(
  faqs?: FaqItem[],
  posts: { title: string; slug: string; date?: string }[] = []
): JsonLd[] {
  const postItems = posts.map((post) => ({
    name: post.title,
    url: getCanonicalUrl(ROUTES.blogPost(post.slug)),
  }));

  const faqSchema = faqs ? buildFaqPageSchema(faqs) : null;

  return [
    buildCollectionPageSchema(
      "AutoSalesReviews Blog",
      "Expert car buying tips, dealer insights, and automotive guides for smart shoppers.",
      ROUTES.blog
    ),
    {
      "@type": "Blog",
      name: `${SITE.name} Blog`,
      url: getCanonicalUrl(ROUTES.blog),
      description:
        "Car buying tips, dealer news, and automotive guides from AutoSalesReviews.",
      publisher: {
        "@type": "Organization",
        name: SITE.name,
        url: getCanonicalUrl(ROUTES.home),
      },
      blogPost: posts.map((post) => ({
        "@type": "BlogPosting",
        headline: post.title,
        url: getCanonicalUrl(ROUTES.blogPost(post.slug)),
        datePublished: post.date ? parseBlogDate(post.date) : undefined,
      })),
    },
    buildItemListSchema("Blog articles", postItems),
    ...(faqSchema ? [faqSchema] : []),
  ];
}

export function buildCitiesDirectorySchemas(faqs?: FaqItem[]): JsonLd[] {
  const cityItems = TARGET_CITIES.map((city) => ({
    name: `${city.city}, ${city.stateCode} car dealers`,
    url: getCanonicalUrl(ROUTES.dealerCity(city.slug)),
  }));

  const faqSchema = faqs ? buildFaqPageSchema(faqs) : null;

  return [
    buildCollectionPageSchema(
      "Browse Car Dealers by City",
      "Directory of trusted car dealerships in major cities across the United States.",
      ROUTES.cities
    ),
    buildItemListSchema("Car dealer cities", cityItems),
    buildBreadcrumbSchema([
      { name: "Home", path: ROUTES.home },
      { name: "Dealers", path: ROUTES.dealers },
      { name: "Cities", path: ROUTES.cities },
    ]),
    ...(faqSchema ? [faqSchema] : []),
  ];
}

export function buildHowToPageSchema(): JsonLd {
  return {
    "@type": "HowTo",
    name: "How to find and buy a car on AutoSalesReviews",
    description:
      "Search vehicles, compare dealer ratings, and contact trusted dealerships in three steps.",
    step: HOW_IT_WORKS_STEPS.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      name: step.title,
      text: step.description,
    })),
  };
}

export function buildHowItWorksPageSchemas(): JsonLd[] {
  return [
    buildWebPageSchema(
      "How AutoSalesReviews Works",
      "Learn how to search vehicles, compare dealer ratings, and buy with confidence.",
      ROUTES.howItWorks
    ),
    buildHowToPageSchema(),
  ];
}

export function buildWriteReviewPageSchema(): JsonLd {
  return buildWebPageSchema(
    "Write a Dealer Review",
    "Share your car dealership experience and help other buyers make smarter decisions.",
    ROUTES.writeReview
  );
}

export function buildVehicleListItems(
  vehicles: Pick<Vehicle, "id" | "year" | "make" | "model">[],
  limit = 20
): { name: string; url: string }[] {
  return vehicles.slice(0, limit).map((vehicle) => ({
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
    url: getCanonicalUrl(ROUTES.vehicleDetail(vehicle.id)),
  }));
}
