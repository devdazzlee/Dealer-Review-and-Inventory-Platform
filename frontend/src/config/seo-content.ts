import { ROUTES } from "@/config/constants";
import {
  getVehicleCategoryConfig,
  isVehicleCategoryKey,
  vehicleCategoryHref,
  type VehicleCategoryKey,
} from "@/config/vehicle-categories";
import { toCityStateSlug } from "@/lib/dealers/location-slugs";
import type { FaqItem } from "@/lib/schema/types";

/** Inline text or an internal link within SEO copy. */
export type SeoInline = string | { text: string; href: string };

export interface SeoBlock {
  type: "h2" | "h3" | "p";
  content: SeoInline[];
}

export interface SeoContent {
  blocks: SeoBlock[];
}

function link(text: string, href: string): SeoInline {
  return { text, href };
}

export const HOME_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["Find car dealerships you can trust before you buy"],
    },
    {
      type: "p",
      content: [
        "Shopping for a vehicle should start with research, not pressure. ",
        link("AutoSalesReviews", ROUTES.home),
        " helps you ",
        link("find car dealerships", ROUTES.dealers),
        " across the United States, compare ",
        link("auto dealer reviews", ROUTES.dealers),
        ", and browse inventory from stores that earn their reputation through real customer experiences, not paid placement.",
      ],
    },
    {
      type: "h3",
      content: ["Search inventory and reviews in one place"],
    },
    {
      type: "p",
      content: [
        "Whether you want to ",
        link("buy used cars nationwide", ROUTES.vehicles),
        " or explore new models at a local showroom, our platform connects you with ",
        link("trusted car dealers", ROUTES.dealers),
        " nationwide. Filter by make, model, price, and body style, then read ratings sourced from verified review platforms before you schedule a test drive.",
      ],
    },
    {
      type: "h3",
      content: ["Shop by city and compare local dealers"],
    },
    {
      type: "p",
      content: [
        "Local markets differ in pricing, inventory, and service quality. Browse our ",
        link("city dealer directory", ROUTES.cities),
        " to find dealerships in major metros like New York, Los Angeles, Chicago, and Houston. Each city page includes verified reviews, nearby dealer links, and inventory filtered to your area, so you can research locally before you visit the lot.",
      ],
    },
    {
      type: "h3",
      content: ["Built for confident car buyers"],
    },
    {
      type: "p",
      content: [
        "Every listing includes location details, contact information, and aggregated star ratings so you can shortlist dealerships quickly. Start on our ",
        link("dealer directory", ROUTES.dealers),
        " to compare stores near you, or jump straight to ",
        link("cars for sale", ROUTES.vehicles),
        " to search thousands of vehicles from top-rated sellers. The goal is simple: give you the clarity you need to choose the right dealer and the right car.",
      ],
    },
    {
      type: "h3",
      content: ["How our ratings actually work"],
    },
    {
      type: "p",
      content: [
        "Instead of collecting reviews ourselves and hoping shoppers trust a brand-new score, we pull ratings from platforms buyers already rely on. Google reviews combine with our own verified customer reviews into a single score for each dealership, and we show each dealer's Yelp rating alongside it. Dealers cannot pay to have negative feedback removed, and featured placement never overrides a low rating. That means a five-star badge on ",
        link("AutoSalesReviews", ROUTES.home),
        " reflects real customer experiences with sales pressure, pricing honesty, and how a dealership handled problems after the sale, not marketing spend.",
      ],
    },
    {
      type: "h3",
      content: ["New, used, and everything in between"],
    },
    {
      type: "p",
      content: [
        "Not every shopper wants the same thing. Some buyers want a certified pre-owned vehicle with remaining factory warranty, others want the lowest possible mileage for the money, and some are cross-shopping new models against last year's leftover inventory. Our filters let you set condition, year range, and price ceiling all at once, so you only see ",
        link("cars for sale", ROUTES.vehicles),
        " that actually match your situation. Combine that with dealer ratings and you can shortlist a handful of realistic options in minutes instead of driving between lots all weekend.",
      ],
    },
  ],
};

export const DEALERS_INTRO_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["Discover car dealerships near me with verified reviews"],
    },
    {
      type: "p",
      content: [
        "Looking for ",
        link("car dealerships near me", ROUTES.dealers),
        "? AutoSalesReviews lists ",
        link("best car dealers", ROUTES.dealers),
        " across every state, with filters for city, region, and minimum rating. Each profile combines ",
        link("verified dealer reviews", ROUTES.dealers),
        " from trusted sources so you can compare reputation, inventory, and contact details before you visit the lot.",
      ],
    },
    {
      type: "p",
      content: [
        "Use the search bar to narrow results by location, or browse featured and top-rated stores nationwide. When you find a dealership that fits, view their full profile and explore ",
        link("vehicles they have listed", ROUTES.vehicles),
        ", all from one place designed for serious car shoppers.",
      ],
    },
  ],
};

export const DEALERS_EXTENDED_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["Why shoppers use our dealer directory"],
    },
    {
      type: "h3",
      content: ["Transparent ratings you can compare"],
    },
    {
      type: "p",
      content: [
        "We aggregate review scores from established platforms so you see a balanced picture of each dealership's service, pricing fairness, and follow-through. No hidden scores and no pay-to-rank, just data that helps you identify ",
        link("trusted car dealers", ROUTES.dealers),
        " in your area or anywhere you are willing to travel.",
      ],
    },
    {
      type: "h3",
      content: ["Nationwide coverage, local detail"],
    },
    {
      type: "p",
      content: [
        "Our directory includes hundreds of dealerships nationwide, with new states and cities added regularly. Filter by state or city, sort by rating, and open full profiles with hours, phone numbers, and maps. Many dealers also link to ",
        link("live inventory", ROUTES.vehicles),
        " so you can see what is on the lot before you make the drive.",
      ],
    },
    {
      type: "h3",
      content: ["How it works"],
    },
    {
      type: "p",
      content: [
        "Search or browse ",
        link("car dealerships", ROUTES.dealers),
        ", read ",
        link("verified dealer reviews", ROUTES.dealers),
        ", and shortlist your top choices. Visit dealer profiles for contact info, then continue to ",
        link("search car inventory", ROUTES.vehicles),
        " filtered by make, price, or body style. It is a straightforward path from research to test drive, built for buyers who want facts first.",
      ],
    },
    {
      type: "h3",
      content: ["What to check on every dealer profile"],
    },
    {
      type: "p",
      content: [
        "Before you drive out to a lot, open the full profile and look past the star average. Check how many total reviews back that score, since a 4.9 built on five reviews carries less weight than a 4.5 built on five hundred. Read a few recent comments for mentions of pricing transparency, how trade-in offers were handled, and whether the service department followed through after the sale. Confirm the address, phone number, and hours are current, then check whether the dealership links to ",
        link("live inventory", ROUTES.vehicles),
        " you can browse before you commit to a visit.",
      ],
    },
    {
      type: "h3",
      content: ["Comparing multiple dealerships at once"],
    },
    {
      type: "p",
      content: [
        "Most buyers shortlist two or three dealerships before making a decision, and that comparison is where a directory like this earns its keep. Sort by rating or distance, open each profile in a new tab, and weigh inventory selection alongside review sentiment rather than price alone. If two dealers carry the same vehicle at a similar price, the one with a stronger service reputation and clearer communication in past reviews is usually the safer bet, especially if you plan to bring the car back for maintenance.",
      ],
    },
  ],
};

export const VEHICLES_INTRO_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["Search cars for sale from trusted dealers nationwide"],
    },
    {
      type: "p",
      content: [
        "Browse ",
        link("cars for sale", ROUTES.vehicles),
        " from verified dealerships across the country. Whether you are comparing ",
        link("used cars nationwide", ROUTES.vehicles),
        " or shopping for a specific make and model, our filters help you ",
        link("search car inventory", ROUTES.vehicles),
        " by price, year, mileage, condition, and body style in seconds.",
      ],
    },
    {
      type: "p",
      content: [
        "Every vehicle listing connects to a rated ",
        link("dealer profile", ROUTES.dealers),
        " so you can check reviews before you inquire. Sort by price or mileage, refine by state, and open any listing for full specs, photos, and dealer contact details, everything you need to move from browsing to buying with confidence.",
      ],
    },
    {
      type: "h3",
      content: ["Narrowing thousands of listings down to a shortlist"],
    },
    {
      type: "p",
      content: [
        "With inventory this large, the fastest path to a decision is stacking filters instead of scrolling page after page. Set your price ceiling first, then narrow by body style, whether you want ",
        link("SUVs", vehicleCategoryHref("SUV")),
        ", ",
        link("sedans", vehicleCategoryHref("Sedan")),
        ", or ",
        link("trucks", vehicleCategoryHref("Truck")),
        ", and finally by condition and mileage. Sorting the remaining results by lowest price or lowest mileage usually surfaces the handful of vehicles actually worth a closer look, rather than every match for a broad search term.",
      ],
    },
    {
      type: "h3",
      content: ["Reading a listing before you contact the dealer"],
    },
    {
      type: "p",
      content: [
        "A good listing tells you almost everything you need before you pick up the phone: full trim and options, mileage, accident or title history where available, and clear photos of the interior, exterior, and any visible wear. Compare the asking price against similar mileage and trim on nearby listings, and check the connected ",
        link("dealer profile", ROUTES.dealers),
        " for how that store's past customers rated pricing honesty and follow-through. If the numbers and the reviews both line up, you have a strong candidate for a test drive.",
      ],
    },
  ],
};

export type { VehicleCategoryKey } from "@/config/vehicle-categories";
export {
  getVehicleCategoryConfig,
  isVehicleCategoryKey,
  vehicleCategoryHref,
  VEHICLE_CATEGORY_KEYS,
} from "@/config/vehicle-categories";

export function getVehicleCategorySeoContent(
  bodyStyle: string | undefined
): SeoContent | null {
  return getVehicleCategoryConfig(bodyStyle)?.seoContent ?? null;
}

export const ABOUT_EXTENDED_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["Our mission: honest car shopping nationwide"],
    },
    {
      type: "p",
      content: [
        "AutoSalesReviews exists because buying a car should not feel like a gamble. We built a platform where drivers can ",
        link("find car dealerships", ROUTES.dealers),
        ", read ",
        link("auto dealer reviews", ROUTES.dealers),
        ", and ",
        link("search vehicle inventory", ROUTES.vehicles),
        " before they ever step onto a sales floor. Our mission is to put transparent information in your hands so you choose the right dealer, not just the closest one.",
      ],
    },
    {
      type: "h3",
      content: ["Trust signals you can rely on"],
    },
    {
      type: "p",
      content: [
        "We list hundreds of dealerships and thousands of vehicles, with coverage expanding nationwide. Review scores are aggregated from established third-party sources, not edited by dealers or advertisers. Featured listings highlight quality stores; they do not replace verified ratings. We publish clear contact information, real locations, and ",
        link("dealer profiles", ROUTES.dealers),
        " you can compare side by side.",
      ],
    },
    {
      type: "h3",
      content: ["How our reviews work"],
    },
    {
      type: "p",
      content: [
        "Each dealership profile shows an average star rating compiled from customer feedback on trusted review platforms. We do not allow dealers to pay to remove or suppress negative reviews. Ratings reflect real experiences with sales staff, pricing transparency, and post-sale support. As we expand, shoppers will be able to submit reviews directly on AutoSalesReviews, today, we surface verified external scores so you still get an unbiased starting point.",
      ],
    },
    {
      type: "h3",
      content: ["Built for buyers, improving every month"],
    },
    {
      type: "p",
      content: [
        "Our team adds inventory search, regional browsing, and mobile-friendly profiles because those are the tools car buyers ask for most. Explore ",
        link("cars for sale", ROUTES.vehicles),
        ", read our ",
        link("FAQ", ROUTES.faq),
        ", or ",
        link("contact us", ROUTES.contact),
        " with questions. Whether you shop locally or ",
        link("buy used cars nationwide", ROUTES.vehicles),
        ", we are here to help you do it with confidence.",
      ],
    },
  ],
};

export const FOR_DEALERS_EXTENDED_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["Grow your dealership with motivated buyers"],
    },
    {
      type: "p",
      content: [
        "AutoSalesReviews connects your store to shoppers actively comparing ",
        link("car dealerships", ROUTES.dealers),
        " and ",
        link("vehicle inventory", ROUTES.vehicles),
        " nationwide. Listing is built on trust: your reputation comes from real ",
        link("customer reviews", ROUTES.dealers),
        ", not ad spend. That attracts buyers who are ready to buy, not just browsing.",
      ],
    },
    {
      type: "h3",
      content: ["Platform stats at a glance"],
    },
    {
      type: "p",
      content: [
        "Shoppers use AutoSalesReviews to search thousands of vehicles from hundreds of dealers nationwide. Dealership profiles include ratings, location, contact details, and links to inventory, giving your store visibility where buyers already research. Featured placement highlights quality partners without compromising review integrity.",
      ],
    },
    {
      type: "h3",
      content: ["Benefits of listing your dealership"],
    },
    {
      type: "p",
      content: [
        "Reach active buyers comparing options online. Showcase your full profile with maps, phone, and hours. Build credibility through verified review scores shoppers trust. Inventory integration lets buyers browse your stock from your profile and our ",
        link("vehicle search", ROUTES.vehicles),
        ". No pay-to-hide reviews, your service earns your rating.",
      ],
    },
    {
      type: "h3",
      content: ["How onboarding works"],
    },
    {
      type: "p",
      content: [
        "Email our team with your dealership name, city, state, and website. We verify your business and publish or update your profile, typically within one business day. Your listing goes live with ratings and contact details. We notify you when review responses and expanded inventory tools launch. ",
        link("See example profiles", ROUTES.dealers),
        " to preview what buyers see today.",
      ],
    },
  ],
};

export type DealersListingSeoContext =
  | { type: "default" }
  | { type: "state"; stateCode: string; stateName: string }
  | { type: "city"; city: string; stateCode: string; stateName: string };

export function getDealersListingSeoContent(
  context: DealersListingSeoContext = { type: "default" }
): { intro: SeoContent; extended: SeoContent } {
  if (context.type === "state") {
    return {
      intro: {
        blocks: [
          {
            type: "h2",
            content: [
              `Find car dealerships in ${context.stateName} with verified reviews`,
            ],
          },
          {
            type: "p",
            content: [
              `Shopping for a car in ${context.stateName}? Browse `,
              link(
                `car dealerships in ${context.stateName}`,
                ROUTES.dealerState(context.stateCode)
              ),
              " on AutoSalesReviews. Compare ",
              link("best car dealers", ROUTES.dealers),
              " by ",
              link("verified dealer reviews", ROUTES.dealers),
              ", star ratings, and contact details before you visit a showroom.",
            ],
          },
          {
            type: "p",
            content: [
              "Filter by city or minimum rating to shortlist stores near you, then explore ",
              link("cars for sale", ROUTES.vehicles),
              ` from ${context.stateName} dealers, or search our full `,
              link("nationwide inventory", ROUTES.vehicles),
              " if you are open to traveling for the right deal.",
            ],
          },
        ],
      },
      extended: {
        blocks: [
          {
            type: "h2",
            content: [`Why compare dealers in ${context.stateName}?`],
          },
          {
            type: "h3",
            content: ["Local inventory with transparent ratings"],
          },
          {
            type: "p",
            content: [
              `Every ${context.stateName} listing includes aggregated review scores from trusted platforms, business hours, phone numbers, and maps. That makes it easier to identify `,
              link("trusted car dealers", ROUTES.dealers),
              " without relying on word of mouth alone.",
            ],
          },
          {
            type: "h3",
            content: ["Search dealers and vehicles together"],
          },
          {
            type: "p",
            content: [
              "Start on this page to compare dealerships, then continue to ",
              link("search car inventory", ROUTES.vehicles),
              ` filtered to ${context.stateName}. You can also browse `,
              link("dealers nationwide", ROUTES.dealers),
              " if your search expands beyond state lines.",
            ],
          },
        ],
      },
    };
  }

  if (context.type === "city") {
    const cityLabel = `${context.city}, ${context.stateName}`;
    return {
      intro: {
        blocks: [
          {
            type: "h2",
            content: [
              `Car dealerships near me in ${cityLabel}`,
            ],
          },
          {
            type: "p",
            content: [
              `Looking for `,
              link(
                `car dealerships near me in ${context.city}`,
                ROUTES.dealerCity(
                  toCityStateSlug(context.city, context.stateCode)
                )
              ),
              "? Compare ",
              link("best car dealers", ROUTES.dealers),
              ` in ${cityLabel} with `,
              link("verified dealer reviews", ROUTES.dealers),
              ", combined star ratings, and full contact profiles.",
            ],
          },
          {
            type: "p",
            content: [
              "Read reviews, check hours and phone numbers, and browse ",
              link("local vehicle inventory", ROUTES.vehicles),
              ` from ${context.city} dealerships, or expand to `,
              link(`all dealers in ${context.stateName}`, ROUTES.dealerState(context.stateCode)),
              " for more options.",
            ],
          },
        ],
      },
      extended: {
        blocks: [
          {
            type: "h2",
            content: [`How to choose a dealer in ${cityLabel}`],
          },
          {
            type: "h3",
            content: ["Compare ratings before you visit"],
          },
          {
            type: "p",
            content: [
              "Use minimum rating filters and open each profile to read combined Google and verified-review scores, plus each dealer's Yelp rating. Shoppers in ",
              cityLabel,
              " rely on ",
              link("auto dealer reviews", ROUTES.dealers),
              " to avoid surprises on pricing, trade-in offers, and service follow-through.",
            ],
          },
          {
            type: "h3",
            content: ["Browse inventory from local sellers"],
          },
          {
            type: "p",
            content: [
              "Many ",
              context.city,
              " dealers list ",
              link("cars for sale", ROUTES.vehicles),
              " on AutoSalesReviews. Search by make, price, and body style, then contact the dealership directly from any listing page.",
            ],
          },
        ],
      },
    };
  }

  return {
    intro: DEALERS_INTRO_SEO_CONTENT,
    extended: DEALERS_EXTENDED_SEO_CONTENT,
  };
}

export const BLOG_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["Car buying tips from trusted dealer review experts"],
    },
    {
      type: "p",
      content: [
        "The AutoSalesReviews blog helps you shop smarter with practical guides on ",
        link("finding car dealerships", ROUTES.dealers),
        ", reading ",
        link("auto dealer reviews", ROUTES.dealers),
        ", and navigating ",
        link("cars for sale", ROUTES.vehicles),
        " nationwide. Whether you are buying your first vehicle or trading up, our articles cover financing, test drives, and how to spot a dealership you can trust.",
      ],
    },
    {
      type: "h3",
      content: ["Guides for every stage of your search"],
    },
    {
      type: "p",
      content: [
        "Browse buying guides, dealer insights, and industry news written for real shoppers, not sales pitches. When you are ready to act, use our ",
        link("vehicle search", ROUTES.vehicles),
        " and ",
        link("dealer directory", ROUTES.dealers),
        " to put what you learn into practice.",
      ],
    },
    {
      type: "h3",
      content: ["Topics we cover most"],
    },
    {
      type: "p",
      content: [
        "Expect practical, specific advice rather than generic tips you have already read a dozen times: what to ask before a trade-in appraisal, how to read a Carfax report line by line, the real differences between new, used, and certified pre-owned pricing, and how to prepare for a test drive so you actually notice problems instead of just enjoying the new-car smell. We also cover how to interpret combined dealer ratings so a single review does not sway a decision that should be based on a pattern of feedback.",
      ],
    },
    {
      type: "h3",
      content: ["Written independent of any dealership"],
    },
    {
      type: "p",
      content: [
        "Nothing here is sponsored by a manufacturer or a specific dealership. Our guides are written from the buyer's side of the table, which means the advice sometimes points you away from add-ons, financing terms, or upsells that are not in your interest. If an article recommends checking a specific detail before you sign paperwork, it is because that detail has cost real buyers money in the past, not because it makes for good marketing copy.",
      ],
    },
  ],
};

export const HOW_IT_WORKS_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["How to find trusted car dealers and buy with confidence"],
    },
    {
      type: "p",
      content: [
        "AutoSalesReviews makes it simple to ",
        link("find car dealerships", ROUTES.dealers),
        ", compare ",
        link("verified dealer reviews", ROUTES.dealers),
        ", and ",
        link("search car inventory", ROUTES.vehicles),
        " in three steps. Search by location or dealer name, review combined Google and verified-customer ratings plus each dealer's Yelp score, then browse vehicles from stores that earn strong customer feedback.",
      ],
    },
    {
      type: "h3",
      content: ["From research to test drive"],
    },
    {
      type: "p",
      content: [
        "Filter ",
        link("cars for sale", ROUTES.vehicles),
        " by make, price, mileage, and body style. Open dealer profiles for phone numbers, hours, and maps. When you find the right match, contact the seller directly, no middleman, no pressure. Learn more on our ",
        link("FAQ", ROUTES.faq),
        " or ",
        link("About", ROUTES.about),
        " pages.",
      ],
    },
    {
      type: "h3",
      content: ["Step one: narrow the field with search"],
    },
    {
      type: "p",
      content: [
        "Start broad and narrow fast. Search by dealership name if you already have a store in mind, or search by city or state if you are starting from scratch. From there, layer on filters, minimum rating, distance, and inventory availability, until the results are a manageable shortlist instead of an overwhelming directory. Most shoppers land on two or three serious candidates within a few minutes of searching.",
      ],
    },
    {
      type: "h3",
      content: ["Step two: let ratings do the pre-screening"],
    },
    {
      type: "p",
      content: [
        "Once you have a shortlist, ratings help you rank it. A dealership with a strong combined Google and verified-review score, plus a solid Yelp rating, has already been vetted by hundreds of other buyers, which saves you from learning about pricing pressure or slow service the hard way. Open a few individual reviews rather than trusting the average number alone, recent comments tell you more about how a dealership operates today than an older review from years ago.",
      ],
    },
    {
      type: "h3",
      content: ["Step three: verify before you visit"],
    },
    {
      type: "p",
      content: [
        "Before you drive out, confirm the vehicle is still available, ask about any advertised incentives, and get a rough out-the-door price over the phone or by email. This single step avoids the most common frustration in car shopping: arriving to find the car already sold or the price different from what was listed. A dealership willing to answer these questions clearly before your visit is usually one that will be straightforward once you are there in person.",
      ],
    },
  ],
};

export const CONTACT_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["We help car buyers and dealerships nationwide"],
    },
    {
      type: "p",
      content: [
        "Questions about ",
        link("searching cars for sale", ROUTES.vehicles),
        ", reading ",
        link("dealer reviews", ROUTES.dealers),
        ", or ",
        link("listing your dealership", ROUTES.forDealers),
        "? Our team supports shoppers and dealer partners nationwide. Reach out by email or phone during business hours and we will respond within one business day.",
      ],
    },
    {
      type: "h3",
      content: ["Common reasons to contact us"],
    },
    {
      type: "p",
      content: [
        "Buyers contact us for help navigating search filters, understanding review scores, and reporting inaccurate listings. Dealerships reach out to ",
        link("join the platform", ROUTES.forDealers),
        ", update profile details, or ask about inventory integration. For quick answers, visit our ",
        link("FAQ", ROUTES.faq),
        " first.",
      ],
    },
    {
      type: "h3",
      content: ["What to include in your message"],
    },
    {
      type: "p",
      content: [
        "The faster we can identify what you are looking at, the faster we can help. If your question involves a specific dealership or vehicle, include the listing name or a link so our team does not have to search for it. For accuracy reports, describe exactly what looks wrong, an outdated phone number, an incorrect address, or a listing that appears sold, so we can follow up with the dealership directly instead of guessing at the issue.",
      ],
    },
    {
      type: "h3",
      content: ["Response times and what happens next"],
    },
    {
      type: "p",
      content: [
        "Most messages get a reply within one business day during our posted support hours. Straightforward requests, like correcting a listing detail, are usually resolved in a single reply. Dealer partnership inquiries may take a little longer since our team verifies each business before publishing or updating a profile. If you have not heard back after two business days, feel free to follow up, sometimes messages land in a spam filter on our end too.",
      ],
    },
  ],
};

export const FAQ_INTRO_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["Answers about car search, dealer reviews, and listings"],
    },
    {
      type: "p",
      content: [
        "Whether you want to ",
        link("buy used cars nationwide", ROUTES.vehicles),
        ", compare ",
        link("best car dealers", ROUTES.dealers),
        ", or understand how ",
        link("verified dealer reviews", ROUTES.dealers),
        " work, this help center covers the essentials. Browse questions below or ",
        link("contact our team", ROUTES.contact),
        " for personalized support.",
      ],
    },
  ],
};

export const WRITE_REVIEW_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["Share your dealership experience with other car buyers"],
    },
    {
      type: "p",
      content: [
        "Honest ",
        link("auto dealer reviews", ROUTES.dealers),
        " help the next shopper avoid bad experiences and find ",
        link("trusted car dealers", ROUTES.dealers),
        ". When review submission opens on AutoSalesReviews, you will rate your visit, describe sales and service quality, and contribute to the same scores other buyers rely on when they ",
        link("search car inventory", ROUTES.vehicles),
        ".",
      ],
    },
    {
      type: "h3",
      content: ["Why reviews matter"],
    },
    {
      type: "p",
      content: [
        "Detailed feedback keeps ratings accurate and gives dealerships fair incentive to improve. Until the form launches, browse ",
        link("dealer profiles", ROUTES.dealers),
        " to see how existing reviews help shoppers ",
        link("find car dealerships", ROUTES.dealers),
        " with confidence.",
      ],
    },
    {
      type: "h3",
      content: ["What makes a review actually useful"],
    },
    {
      type: "p",
      content: [
        "A star rating alone tells the next buyer very little. The reviews that help people most describe specifics: how the negotiation went, whether the out-the-door price matched what was advertised, how long financing paperwork took, and whether the service department followed through on anything promised at delivery. If something went wrong, note whether the dealership tried to make it right, that context matters as much as the outcome itself.",
      ],
    },
    {
      type: "h3",
      content: ["In the meantime, use existing ratings"],
    },
    {
      type: "p",
      content: [
        "While our own submission form is in progress, every dealer profile already shows a combined score pulled from Google and our own verified reviews, plus a separate Yelp rating. Read a handful of the most recent comments rather than relying on the average alone, patterns across multiple reviews are far more reliable than any single glowing or scathing post. When submission opens, your review will sit alongside those same sources to give future shoppers an even fuller picture.",
      ],
    },
  ],
};

export const SITEMAP_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["Explore every section of AutoSalesReviews"],
    },
    {
      type: "p",
      content: [
        "Use this sitemap to navigate ",
        link("cars for sale", ROUTES.vehicles),
        ", ",
        link("car dealerships nationwide", ROUTES.dealers),
        ", buying guides, and support pages. Shop by region, body style, or brand, or jump to ",
        link("dealer reviews", ROUTES.dealers),
        ", ",
        link("how it works", ROUTES.howItWorks),
        ", and ",
        link("FAQ", ROUTES.faq),
        " for help at every step of your search.",
      ],
    },
  ],
};

interface VehicleDetailSeoInput {
  year: number;
  make: string;
  model: string;
  bodyStyle: string;
  condition: string;
  dealer: { name: string; city: string; state: string; slug: string };
}

export function buildVehicleDetailSeoContent(
  vehicle: VehicleDetailSeoInput
): SeoContent {
  const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const bodyStyleQuery = isVehicleCategoryKey(vehicle.bodyStyle)
    ? vehicleCategoryHref(vehicle.bodyStyle as VehicleCategoryKey)
    : `${ROUTES.vehicles}?bodyStyle=${encodeURIComponent(vehicle.bodyStyle)}`;

  return {
    blocks: [
      {
        type: "h2",
        content: [`About this ${label} for sale`],
      },
      {
        type: "p",
        content: [
          `This ${vehicle.condition.toLowerCase()} ${label} is listed by `,
          link(vehicle.dealer.name, ROUTES.dealerProfile(vehicle.dealer.slug)),
          ` in ${vehicle.dealer.city}, ${vehicle.dealer.state}. Browse photos, specifications, and features above, then contact the dealer to ask questions or schedule a test drive.`,
        ],
      },
      {
        type: "h3",
        content: ["More vehicles like this one"],
      },
      {
        type: "p",
        content: [
          "Compare similar ",
          link(`${vehicle.bodyStyle}s for sale`, bodyStyleQuery),
          ", explore ",
          link("all cars for sale", ROUTES.vehicles),
          ", or read ",
          link("dealer reviews", ROUTES.dealerProfile(vehicle.dealer.slug)),
          ` for ${vehicle.dealer.name} before you buy.`,
        ],
      },
      {
        type: "h3",
        content: ["Before you contact the dealer"],
      },
      {
        type: "p",
        content: [
          `Confirm this ${label} is still on the lot before you make the trip, listings can change quickly on popular vehicles. Ask ${vehicle.dealer.name} for the full out-the-door price including fees and any dealer add-ons, and request a vehicle history report if one is not already included for used inventory. If financing is part of your plan, get pre-approved with your own bank or credit union first so you have a number to compare against whatever the dealership offers.`,
        ],
      },
      {
        type: "h3",
        content: [`What buyers say about ${vehicle.dealer.name}`],
      },
      {
        type: "p",
        content: [
          `Before scheduling a visit, check the `,
          link(`${vehicle.dealer.name} profile`, ROUTES.dealerProfile(vehicle.dealer.slug)),
          ` for combined Google and verified-review ratings, plus each dealer's Yelp score. Recent reviews usually mention how straightforward the pricing conversation was and whether the dealership followed through after the sale, both good signals for how your own visit is likely to go.`,
        ],
      },
    ],
  };
}

interface DealerProfileSeoInput {
  name: string;
  city: string;
  state: string;
  slug: string;
}

export function buildDealerProfileSeoContent(
  dealer: DealerProfileSeoInput
): SeoContent {
  return {
    blocks: [
      {
        type: "h2",
        content: [`${dealer.name} reviews and inventory in ${dealer.city}, ${dealer.state}`],
      },
      {
        type: "p",
        content: [
          link(dealer.name, ROUTES.dealerProfile(dealer.slug)),
          " is listed on AutoSalesReviews with ",
          link("verified dealer reviews", ROUTES.dealers),
          ", contact details, and ",
          link("vehicle inventory", ROUTES.vehicles),
          `. Compare ratings, read customer feedback, and browse cars for sale from this ${dealer.city} dealership.`,
        ],
      },
      {
        type: "h3",
        content: [`More dealers in ${dealer.city}, ${dealer.state}`],
      },
      {
        type: "p",
        content: [
          "Not ready to commit? Compare other ",
          link("car dealerships near me", ROUTES.dealers),
          ", ",
          link("search cars for sale nationwide", ROUTES.vehicles),
          ", or ",
          link("write a review", ROUTES.writeReview),
          ` after your visit to help other buyers find trusted car dealers.`,
        ],
      },
      {
        type: "h3",
        content: [`What to ask before you visit ${dealer.name}`],
      },
      {
        type: "p",
        content: [
          `Call or email ahead to confirm a specific vehicle is still available and get a rough out-the-door price, taxes, fees, and any add-ons included. Ask whether ${dealer.name} offers a vehicle history report on used inventory, what their trade-in appraisal process looks like, and how long financing approval typically takes. Dealerships that answer these questions clearly and quickly over the phone tend to be just as straightforward once you are standing on the lot.`,
        ],
      },
      {
        type: "h3",
        content: [`Why shoppers check ratings before visiting ${dealer.city}`],
      },
      {
        type: "p",
        content: [
          `Combined Google and verified-review ratings, plus a separate Yelp score, give you a preview of how ${dealer.name} treats customers before, during, and after the sale. Recent reviews are especially useful, they reflect the dealership's current sales team and service quality rather than an experience from years ago. Reading a handful of comments, not just the star average, is the fastest way to know what to expect from your visit.`,
        ],
      },
    ],
  };
}

export function buildDealerProfileFaqItems(
  dealer: Pick<DealerProfileSeoInput, "name" | "city" | "state">
): FaqItem[] {
  return [
    {
      question: `Is pricing negotiable at ${dealer.name}?`,
      answer: `Most dealerships, including ${dealer.name}, expect some negotiation on out-the-door price, especially on fees and add-ons. Ask for the full price breakdown in writing before you commit.`,
    },
    {
      question: `Does ${dealer.name} offer financing or accept trade-ins?`,
      answer: `Dealer profiles list contact details so you can confirm financing options and trade-in policies directly with ${dealer.name}. Call ahead or ask when you visit to get current terms.`,
    },
    {
      question: `How do I contact ${dealer.name}?`,
      answer: `Use the phone number and address on this profile, or open any of their vehicle listings and select "Book This Car" to reach the dealership directly.`,
    },
    {
      question: `Are the reviews for ${dealer.name} verified?`,
      answer: `Ratings shown here are aggregated from established third-party platforms like Google and Yelp, combined with our own verified customer reviews, not edited or removed by ${dealer.name}, so you see an unbiased picture before you visit.`,
    },
  ];
}

export const CITIES_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["Find car dealerships in your city"],
    },
    {
      type: "p",
      content: [
        "Local markets vary widely in pricing, inventory, and service quality, so shopping by city helps you compare ",
        link("car dealerships near me", ROUTES.dealers),
        " that are actually relevant to you. Browse the directory above to jump straight to ",
        link("verified dealer reviews", ROUTES.dealers),
        ` in major metros nationwide, then narrow further by state if your city isn't listed yet.`,
      ],
    },
    {
      type: "h3",
      content: ["Why shop locally first"],
    },
    {
      type: "p",
      content: [
        "Comparing dealers in your own city keeps test drives and service visits convenient, and lets you weigh combined Google ratings and each dealer's Yelp score against dealers you can actually reach. Each city page includes ",
        link("local vehicle inventory", ROUTES.vehicles),
        " so you can shortlist cars before you ever leave home.",
      ],
    },
    {
      type: "h3",
      content: ["Don't see your city?"],
    },
    {
      type: "p",
      content: [
        "We're adding new markets regularly. In the meantime, browse ",
        link("dealers by state", ROUTES.dealers),
        " to find nearby options, or search our ",
        link("nationwide vehicle inventory", ROUTES.vehicles),
        " and filter by state once you find a dealer worth the drive.",
      ],
    },
    {
      type: "h3",
      content: ["How city pages are organized"],
    },
    {
      type: "p",
      content: [
        "Each city grouped above links to a dedicated page listing dealerships in that market, sorted by combined rating so the strongest options surface first. From any city page you can filter further by minimum rating or browse ",
        link("that city's inventory", ROUTES.vehicles),
        " directly. If you are comparing two nearby cities, opening both pages in separate tabs makes it easy to weigh selection and pricing without losing your place.",
      ],
    },
  ],
};

export const CITIES_FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I find car dealerships in my city?",
    answer:
      "Select your city from the directory above, or use the state directory if your city isn't listed. Each city page shows verified dealer reviews and local inventory.",
  },
  {
    question: "Do you only cover major cities?",
    answer:
      "We prioritize major metros first, but our dealer directory and vehicle search cover dealerships nationwide, even where we haven't built a dedicated city page yet.",
  },
  {
    question: "Can I search vehicle inventory by city?",
    answer:
      "Yes. Open a city page to see dealers in that market, or use the vehicle search and filter by state to browse inventory near a specific city.",
  },
  {
    question: "What if my city isn't listed?",
    answer:
      "Browse dealers by state instead, or search vehicle inventory nationwide. We add new city pages regularly as coverage expands.",
  },
];

export const HOME_FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is AutoSalesReviews free to use?",
    answer:
      "Yes. Searching vehicles, reading dealer reviews, and comparing ratings is completely free for car buyers, with no account required.",
  },
  {
    question: "How do I find a trustworthy car dealer?",
    answer:
      "Use our dealer directory to compare combined Google ratings and each dealer's Yelp score, then read recent customer feedback before you visit the lot.",
  },
  {
    question: "Do you cover dealerships in my state?",
    answer:
      "We list dealerships nationwide, with coverage expanding regularly. Search by city or state to find options near you, or browse nationwide inventory if you're open to traveling for the right deal.",
  },
  {
    question: "How current is the vehicle inventory?",
    answer:
      "Dealers manage their own listings directly, so most inventory reflects current stock. We still recommend confirming availability and price with the dealership before you visit.",
  },
  {
    question: "How do I contact a dealer about a car I like?",
    answer:
      'Open any vehicle listing and use "Book This Car" or "Book a Test Drive" under the photo gallery, or call the dealer directly from their profile card.',
  },
];

export const VEHICLES_FAQ_ITEMS: FaqItem[] = [
  {
    question: "How do I filter vehicles by price, mileage, or body style?",
    answer:
      "Use the filter panel to narrow results by make, model, year, price, mileage, condition, and body style. Filters update the results instantly and can be combined.",
  },
  {
    question: "Are the listed vehicle prices final?",
    answer:
      "Dealers set and manage their own pricing. Listed prices are a strong starting point, but always confirm the out-the-door total, including fees, directly with the dealer before you buy.",
  },
  {
    question: "Can I compare multiple vehicles side by side?",
    answer:
      "Yes. Select the compare option on any listing to add it to your comparison tray, then view specs, price, and mileage side by side on the compare page.",
  },
  {
    question: "How do I contact the dealer about a vehicle?",
    answer:
      'Open the vehicle listing and use "Book This Car" or "Book a Test Drive," or call the dealer directly from the contact details on the listing page.',
  },
  {
    question: "Is this inventory updated in real time?",
    answer:
      "Dealers manage their own listings. We strive for accuracy but recommend confirming availability with the dealership directly before visiting, especially for popular vehicles.",
  },
];

export const DEALERS_FAQ_ITEMS: FaqItem[] = [
  {
    question: "How are dealer ratings calculated?",
    answer:
      "We combine Google ratings with our own verified customer reviews into a single average score, and show each dealer's Yelp rating alongside it, so you get the full picture at a glance.",
  },
  {
    question: "Can a dealership remove a negative review?",
    answer:
      "No. Dealers can respond publicly to reviews, but they cannot delete or suppress honest feedback from verified buyers.",
  },
  {
    question: "How do I contact a dealership listed here?",
    answer:
      "Open any dealer profile for their phone number, address, and hours, or visit one of their vehicle listings to reach out directly about a specific car.",
  },
  {
    question: "Do you cover dealers in every state?",
    answer:
      "Yes, our directory includes dealerships nationwide, with coverage growing regularly. Filter by state or city to find options near you, or browse nationwide if you're open to traveling.",
  },
];

export const ABOUT_FAQ_ITEMS: FaqItem[] = [
  {
    question: "Is AutoSalesReviews affiliated with any dealership?",
    answer:
      "No. We are an independent platform. Dealers cannot pay to remove or edit reviews, and featured placements never replace verified ratings.",
  },
  {
    question: "Where do your dealer ratings come from?",
    answer:
      "We pull ratings from established third-party platforms like Google and Yelp, combined with our own verified customer reviews, giving you an unbiased starting point.",
  },
  {
    question: "Can I submit my own dealership review?",
    answer:
      "Review submission is launching soon. In the meantime, browse existing dealer profiles to see aggregated ratings and feedback from verified sources.",
  },
  {
    question: "How many dealerships and vehicles do you list?",
    answer:
      "AutoSalesReviews lists hundreds of dealerships and thousands of vehicles nationwide, with new listings added regularly.",
  },
];

export const CONTACT_FAQ_ITEMS: FaqItem[] = [
  {
    question: "How quickly will I get a response?",
    answer:
      "Our team responds within one business day, Monday through Friday, 9AM–6PM ET. Messages sent on weekends are answered the next business day.",
  },
  {
    question: "I have a question about a specific dealer or listing, who do I contact?",
    answer:
      "Use the contact form on this page and mention the dealer name or listing so our team can route your question quickly, or reach out directly using the dealer's profile contact details.",
  },
  {
    question: "How do I report inaccurate dealer or vehicle information?",
    answer:
      "Email us with a link to the listing and a brief description of what's incorrect. We review reports and follow up with the dealership directly.",
  },
  {
    question: "Do you offer phone support?",
    answer:
      "Yes. Call during business hours listed above, or email anytime and we'll respond within one business day.",
  },
];

export const WRITE_REVIEW_FAQ_ITEMS: FaqItem[] = [
  {
    question: "When can I submit a review?",
    answer:
      "Review submission is launching soon. We're finalizing the form and moderation tools so feedback stays honest and useful for other shoppers.",
  },
  {
    question: "Will my review be public?",
    answer:
      "Yes, submitted reviews will be shown publicly with your first name and last initial, alongside your star rating and comments.",
  },
  {
    question: "Can dealers remove or edit my review?",
    answer:
      "No. Dealers will be able to respond publicly to reviews, but they will not be able to delete or edit honest feedback from verified buyers.",
  },
  {
    question: "What should I include in my review?",
    answer:
      "Cover your overall experience: sales process, pricing transparency, and service quality. Specific details help other buyers more than a rating alone.",
  },
];

export const HOW_IT_WORKS_FAQ_ITEMS: FaqItem[] = [
  {
    question: "Do I need an account to search dealers or vehicles?",
    answer:
      "No account is required to search vehicles, browse dealer profiles, or compare ratings. Searching and browsing are completely free.",
  },
  {
    question: "How do I narrow down which dealer to visit?",
    answer:
      "Filter by state or city, set a minimum star rating, and open a few profiles to compare hours, contact details, and recent feedback before you decide.",
  },
  {
    question: "What happens after I find a car I like?",
    answer:
      'Open the vehicle listing and use "Book This Car" or "Book a Test Drive" to reach the dealer directly, or call them from their profile page.',
  },
  {
    question: "Are ratings updated regularly?",
    answer:
      "Yes. Average scores are recalculated whenever new reviews come in from our source platforms, so ratings reflect recent customer experiences.",
  },
];

export const FOR_DEALERS_FAQ_ITEMS: FaqItem[] = [
  {
    question: "How much does it cost to list my dealership?",
    answer:
      "Email our team with your dealership details to discuss listing options. Basic profiles include ratings, contact info, and location at no cost to get started.",
  },
  {
    question: "Can I remove or edit negative reviews about my dealership?",
    answer:
      "No. Reviews are aggregated from verified third-party sources and cannot be edited or removed by dealers. You can respond publicly to address feedback.",
  },
  {
    question: "How long does onboarding take?",
    answer:
      "Once you email your dealership name, city, state, and website, our team typically verifies and publishes your profile within one business day.",
  },
  {
    question: "Can I list my vehicle inventory too?",
    answer:
      "Inventory listing tools are rolling out. Email our team to be notified when vehicle listings are available for your dealership.",
  },
];

export const SAVED_SEO_CONTENT: SeoContent = {
  blocks: [
    {
      type: "h2",
      content: ["Keep your favorite vehicles in one place"],
    },
    {
      type: "p",
      content: [
        "Your saved list makes it easy to compare a handful of ",
        link("cars for sale", ROUTES.vehicles),
        " without re-running the same search over and over. Save anything that catches your eye while you browse, then come back here to weigh price, mileage, and dealer ratings side by side before you reach out to a dealership.",
      ],
    },
    {
      type: "h3",
      content: ["How saved vehicles work"],
    },
    {
      type: "p",
      content: [
        "Saves are tied to this browser, no account is required. That means your list stays available across visits on this device, but it will not follow you to a different browser or phone. When account creation launches, we plan to let you merge a browser-based shortlist into your profile so it travels with you.",
      ],
    },
    {
      type: "h3",
      content: ["Turning a shortlist into a decision"],
    },
    {
      type: "p",
      content: [
        "Once you have a few vehicles saved, use the compare option to view specs, price, and mileage in one table, or open each ",
        link("dealer profile", ROUTES.dealers),
        " to check ratings before you contact a seller. Removing a vehicle you have ruled out keeps the list useful as your search narrows.",
      ],
    },
  ],
};

export const SAVED_FAQ_ITEMS: FaqItem[] = [
  {
    question: "Do I need an account to save vehicles?",
    answer:
      "No. Saving is tied to your browser on this device, no sign-up required. Your shortlist stays here as long as you use the same browser.",
  },
  {
    question: "Will my saved vehicles still be here if I come back later?",
    answer:
      "Yes, as long as you return using the same browser and device. Clearing your browser data or switching devices will reset the list.",
  },
  {
    question: "Can I compare my saved vehicles side by side?",
    answer:
      "Yes. Select the compare option on any saved listing to view price, mileage, and specs for multiple vehicles in one table.",
  },
  {
    question: "How do I remove a vehicle from my saved list?",
    answer:
      "Open your saved list and use the remove option on any listing. It will no longer appear here, but you can always save it again later.",
  },
];

export const BLOG_FAQ_ITEMS: FaqItem[] = [
  {
    question: "How often do you publish new articles?",
    answer:
      "We add new buying guides and dealer insights regularly, covering financing, inspections, trade-ins, and how to read dealer reviews.",
  },
  {
    question: "Are these guides specific to any one dealership?",
    answer:
      "No. Our blog covers general car-buying advice that applies nationwide, independent of any single dealer or manufacturer.",
  },
  {
    question: "Can I suggest a topic for a future article?",
    answer:
      "Yes. Contact our team with topic suggestions and we'll consider them for upcoming guides.",
  },
];
