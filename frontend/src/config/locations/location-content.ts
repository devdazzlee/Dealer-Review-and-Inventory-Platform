import { ROUTES, STATE_LABELS } from "@/config/constants";
import type { SeoContent } from "@/config/seo-content";
import type { TargetCity } from "./cities-data";
import { getStateLabel } from "@/lib/dealers/state-slugs";

function link(text: string, href: string) {
  return { text, href };
}

export interface LocationFaqItem {
  question: string;
  answer: string;
}

export function buildCityMetaTitle(city: string, stateCode: string): string {
  const stateName = STATE_LABELS[stateCode] ?? stateCode;
  return `Car Dealers in ${city}, ${stateName} | AutoSalesReviews`;
}

export function buildCityMetaDescription(city: string, stateCode: string): string {
  const stateName = STATE_LABELS[stateCode] ?? stateCode;
  return `Find trusted car dealerships in ${city}, ${stateName}. Browse dealer reviews, compare ratings from Google and Yelp, and search available inventory in ${city}.`;
}

export function buildStateMetaTitle(stateCode: string): string {
  const stateName = getStateLabel(stateCode);
  return `Car Dealers in ${stateName} | AutoSalesReviews`;
}

export function buildStateMetaDescription(stateCode: string): string {
  const stateName = getStateLabel(stateCode);
  return `Find trusted car dealerships across ${stateName}. Browse dealer reviews, compare ratings and search vehicle inventory from dealers throughout ${stateName}.`;
}

export function buildCitySeoContent(target: TargetCity): SeoContent {
  const stateName = STATE_LABELS[target.stateCode] ?? target.stateCode;
  const cityState = `${target.city}, ${stateName}`;

  return {
    blocks: [
      {
        type: "h2",
        content: [`Buying a car in ${cityState}`],
      },
      {
        type: "p",
        content: [
          `${target.city} is ${target.marketDescriptor}. Shoppers here compare `,
          link("car dealerships", ROUTES.dealers),
          " on price, inventory, and reputation before they commit to a test drive. AutoSalesReviews helps you read ",
          link("verified dealer reviews", ROUTES.dealers),
          ` from Google, plus each dealer's Yelp score, then browse `,
          link("cars for sale", ROUTES.vehicles),
          ` listed by ${target.city} dealers without driving lot to lot.`,
        ],
      },
      {
        type: "h3",
        content: ["What local buyers prioritize"],
      },
      {
        type: "p",
        content: [
          `In ${target.city}, the best deal is rarely the first lot you visit. Buyers weigh out-the-door pricing, trade-in offers, finance terms, and how transparent the staff is about fees. Use our filters to set a minimum star rating, then open dealer profiles for phone numbers, hours, and maps. When you find a store you trust, continue to `,
          link("search car inventory", ROUTES.vehicles),
          ` filtered to ${stateName} or ${target.city} specifically.`,
        ],
      },
      {
        type: "h3",
        content: ["New, used, and certified options"],
      },
      {
        type: "p",
        content: [
          `Whether you want a new model with full factory warranty or a late-model used car that absorbed first-year depreciation, ${target.city} dealers typically stock both. Compare condition filters on our `,
          link("vehicle search", ROUTES.vehicles),
          ", read the vehicle history when available, and schedule inspections for any used purchase. Dealers with strong ",
          link("customer reviews", ROUTES.dealers),
          ` in ${target.city} earn their ratings through service, not advertising.`,
        ],
      },
      {
        type: "h3",
        content: ["Shop smarter before you visit the lot"],
      },
      {
        type: "p",
        content: [
          `Research saves time in ${target.city}'s competitive market. Shortlist two or three dealerships using combined ratings, confirm inventory online, and call ahead to verify the car is still available. Read our `,
          link("how it works", ROUTES.howItWorks),
          " guide for a step-by-step approach, or explore ",
          link(`all dealers in ${stateName}`, ROUTES.dealerState(target.stateCode)),
          " if you are willing to travel slightly outside the city for the right car.",
        ],
      },
    ],
  };
}

export function buildCityFaq(target: TargetCity): LocationFaqItem[] {
  const stateName = STATE_LABELS[target.stateCode] ?? target.stateCode;
  const city = target.city;

  return [
    {
      question: `How do I find the best car dealers in ${city}, ${stateName}?`,
      answer: `Start with AutoSalesReviews listings filtered to ${city}. Compare combined Google ratings and each dealer's Yelp score, read recent customer comments, and look for dealers with consistent feedback on pricing transparency and service. Shortlist stores with strong scores and inventory that matches your budget before scheduling visits.`,
    },
    {
      question: `Can I browse ${city} dealer inventory online?`,
      answer: `Yes. Many ${city} dealerships list vehicles on AutoSalesReviews. Use our vehicle search to filter by make, price, mileage, and body style, then confirm details with the dealer directly. Calling ahead ensures the car you want is still on the lot.`,
    },
    {
      question: `Are dealer reviews on AutoSalesReviews verified?`,
      answer: `We aggregate ratings from established third-party review platforms rather than allowing dealers to edit scores. That gives ${city} shoppers an unbiased starting point. Always read several recent reviews to understand sales, finance, and service experiences.`,
    },
    {
      question: `Should I buy in ${city} or expand my search across ${stateName}?`,
      answer: `Staying in ${city} is convenient for test drives and service visits, but expanding to nearby markets in ${stateName} can surface better pricing or selection. Compare city and statewide listings, then factor in travel time and registration requirements before you decide.`,
    },
    {
      question: `What should I ask a ${city} dealer before I buy?`,
      answer: `Request the out-the-door price including all fees, ask for a vehicle history report on used cars, confirm remaining warranty coverage, and verify return or exchange policies in writing. Reputable ${city} dealers answer these questions clearly without pressure.`,
    },
  ];
}

export function buildStateSeoContent(stateCode: string): SeoContent {
  const stateName = getStateLabel(stateCode);

  return {
    blocks: [
      {
        type: "h2",
        content: [`Buying a car in ${stateName}`],
      },
      {
        type: "p",
        content: [
          `${stateName} drivers have distinct needs shaped by climate, commute patterns, and local tax rules. AutoSalesReviews lists `,
          link("car dealerships", ROUTES.dealers),
          ` across ${stateName} with combined Google ratings and each dealer's Yelp score so you can compare stores before you visit. Browse `,
          link("cars for sale", ROUTES.vehicles),
          ` statewide or narrow to your city for local inventory.`,
        ],
      },
      {
        type: "h3",
        content: [`Compare dealers across ${stateName}`],
      },
      {
        type: "p",
        content: [
          `Use minimum rating filters and read dealer profiles for contact details, hours, and maps. Whether you shop near home or drive to another part of ${stateName} for a better deal, `,
          link("verified dealer reviews", ROUTES.dealers),
          " help you avoid surprises in the finance office or service department.",
        ],
      },
      {
        type: "h3",
        content: ["City pages for local search"],
      },
      {
        type: "p",
        content: [
          `We publish dedicated pages for major cities in ${stateName} with local dealer listings, FAQs, and buying tips. Visit our `,
          link("city directory", ROUTES.cities),
          " to jump straight to your market, or use the links below to explore cities with the most dealer activity.",
        ],
      },
      {
        type: "h3",
        content: ["Inventory and financing"],
      },
      {
        type: "p",
        content: [
          `Filter `,
          link("vehicle inventory", ROUTES.vehicles),
          ` by price, mileage, and condition to match your budget anywhere in ${stateName}. Get pre-approved through your bank or credit union before visiting a dealer so you can compare finance offers confidently. Our `,
          link("FAQ", ROUTES.faq),
          " covers common questions about search, ratings, and contacting dealers.",
        ],
      },
    ],
  };
}

export function buildStateFaq(stateCode: string): LocationFaqItem[] {
  const stateName = getStateLabel(stateCode);

  return [
    {
      question: `How many car dealers are listed in ${stateName}?`,
      answer: `AutoSalesReviews lists dealerships across ${stateName} with ratings, contact information, and inventory links. Use state and city filters to see stores near you, and check back as new dealers join the platform.`,
    },
    {
      question: `How are dealer ratings calculated in ${stateName}?`,
      answer: `Each dealership profile shows a combined score from Google reviews, plus each dealer's separate Yelp rating. We do not let dealers pay to hide negative feedback, so ${stateName} shoppers get a balanced view of each store's reputation.`,
    },
    {
      question: `Can I search for used cars across all of ${stateName}?`,
      answer: `Yes. Open our vehicle search and filter by ${stateName} to browse used and new inventory from dealers statewide. You can further narrow by make, model, price, and body style.`,
    },
    {
      question: `Which cities in ${stateName} have dedicated dealer pages?`,
      answer: `We maintain city landing pages for major markets in ${stateName}. Visit the city directory or the links on this page to find dealers in specific cities with local reviews and inventory.`,
    },
    {
      question: `Is AutoSalesReviews free for ${stateName} car buyers?`,
      answer: `Yes. Searching dealers, reading reviews, and browsing vehicle listings is free for buyers in ${stateName} and nationwide. No account is required to compare ratings and inventory.`,
    },
  ];
}
