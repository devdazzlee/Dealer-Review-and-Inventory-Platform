import { ROUTES } from "@/config/constants";
import type { SeoContent, SeoInline } from "@/config/seo-content";
import type { FaqItem } from "@/lib/schema/types";

export type VehicleCategoryKey =
  | "SUV"
  | "Sedan"
  | "Truck"
  | "Electric"
  | "Luxury"
  | "Minivan";

export interface VehicleCategoryConfig {
  key: VehicleCategoryKey;
  label: string;
  h1: string;
  subtitle: string;
  badge: string;
  searchSubmitLabel: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  seoContent: SeoContent;
  faqs: FaqItem[];
}

function link(text: string, href: string): SeoInline {
  return { text, href };
}

export function vehicleCategoryHref(category: VehicleCategoryKey): string {
  return `${ROUTES.vehicles}?bodyStyle=${encodeURIComponent(category)}`;
}

export const VEHICLE_CATEGORY_KEYS: VehicleCategoryKey[] = [
  "SUV",
  "Sedan",
  "Truck",
  "Electric",
  "Luxury",
  "Minivan",
];

export const VEHICLE_CATEGORIES: Record<
  VehicleCategoryKey,
  VehicleCategoryConfig
> = {
  SUV: {
    key: "SUV",
    label: "SUV",
    h1: "SUVs for Sale - Find Your Perfect SUV Nationwide",
    subtitle:
      "Browse new and used SUVs from trusted dealerships across the US. Filter by price, mileage, drivetrain, and condition to compare crossovers, midsize SUVs, and three-row models side by side.",
    badge: "SUV Inventory",
    searchSubmitLabel: "Search SUVs",
    metaTitle: "SUVs for Sale Nationwide | AutoSalesReviews",
    metaDescription:
      "Browse SUVs for sale from trusted dealerships across the US. Compare prices, read reviews and find your next SUV.",
    keywords: [
      "shop SUVs nationwide",
      "used crossover inventory",
      "three-row SUV listings",
      "family sport utility vehicles",
      "compare SUV prices by state",
      "AWD SUV dealer inventory",
    ],
    seoContent: {
      blocks: [
        {
          type: "h2",
          content: ["Your guide to buying an SUV from a trusted dealer"],
        },
        {
          type: "p",
          content: [
            "Sport utility vehicles remain one of the most searched body styles in the US because they combine passenger comfort, cargo flexibility, and available all-wheel drive in a single package. Whether you need a compact crossover for city commuting or a three-row SUV for a growing family, shopping ",
            link("SUVs for sale", vehicleCategoryHref("SUV")),
            " on AutoSalesReviews lets you compare inventory from ",
            link("verified dealerships nationwide", ROUTES.dealers),
            " before you visit a showroom. Every listing links to dealer ratings sourced from trusted review platforms, so you can prioritize sellers with strong track records on pricing transparency and post-sale support.",
          ],
        },
        {
          type: "h3",
          content: ["What to look for when buying an SUV"],
        },
        {
          type: "p",
          content: [
            "Start by matching size class to how you actually drive. Compact crossovers like the Honda CR-V and Toyota RAV4 excel at fuel economy and easy parking, while midsize models such as the Ford Explorer and Toyota Highlander add a third row or more towing capacity. Check ground clearance and drivetrain if you face snow or unpaved roads: front-wheel drive is fine for many buyers, but all-wheel drive adds confidence in northern climates. Inspect cargo space with rear seats up and folded, confirm child-seat fit in the second row, and ask the dealer for a maintenance history on used SUVs. Certified pre-owned programs from major brands can add warranty coverage worth comparing against a lower-priced private-party alternative.",
          ],
        },
        {
          type: "h3",
          content: ["SUV price ranges to expect"],
        },
        {
          type: "p",
          content: [
            "Used compact SUVs often start in the mid-teens to low $20,000s depending on year, mileage, and trim. Midsize and three-row used models typically land between $25,000 and $45,000, while late-model luxury SUVs can exceed $50,000. New SUV pricing spans roughly $28,000 for entry crossovers to $70,000 or more for premium three-row nameplates. Set a maximum price in our filters, then sort by lowest price or lowest mileage to surface deals that fit your budget. Remember that taxes, registration, and optional extended warranties sit outside the sticker price, so leave room in your number for the out-the-door total the dealer quotes.",
          ],
        },
        {
          type: "h3",
          content: ["Popular SUV makes and models"],
        },
        {
          type: "p",
          content: [
            "Shoppers consistently search Toyota RAV4 and Highlander, Honda CR-V and Pilot, Ford Explorer and Escape, Chevrolet Equinox and Tahoe, Jeep Grand Cherokee, Subaru Outback, and Hyundai Tucson. Each brand brings different strengths: Toyota and Honda lead on reliability reputation, domestic brands often lead on towing and trim variety, and Subaru appeals to buyers who want standard all-wheel drive. Use the make filter to narrow results, or browse ",
            link("all cars for sale", ROUTES.vehicles),
            " if you are still deciding between an SUV and a ",
            link("sedan", vehicleCategoryHref("Sedan")),
            " or ",
            link("truck", vehicleCategoryHref("Truck")),
            ". Families needing maximum passenger space should also compare ",
            link("minivans", vehicleCategoryHref("Minivan")),
            " against three-row SUVs.",
          ],
        },
        {
          type: "h3",
          content: ["Tips for SUV shoppers"],
        },
        {
          type: "p",
          content: [
            "Schedule a test drive on roads similar to your daily commute and, if possible, with passengers or cargo you normally carry. Compare fuel-economy ratings between trims before you commit: a larger engine or all-wheel drive can add meaningful cost at the pump. Read dealer reviews on each listing profile, ask for a vehicle history report on used inventory, and confirm whether the price includes any dealer add-ons. When you are ready to expand beyond one body style, explore ",
            link("electric SUVs and crossovers", vehicleCategoryHref("Electric")),
            " or ",
            link("luxury SUVs", vehicleCategoryHref("Luxury")),
            " from premium brands. AutoSalesReviews keeps search, reviews, and contact details in one place so you can move from research to a test drive with confidence.",
          ],
        },
      ],
    },
    faqs: [
      {
        question: "What is the difference between a crossover and a traditional SUV?",
        answer:
          "Crossovers are built on car-based platforms, which typically means a smoother ride, better fuel economy, and unibody construction. Traditional body-on-frame SUVs, such as some full-size models, prioritize towing and off-road durability but often ride firmer and use more fuel. Most family-oriented models sold today are crossovers.",
      },
      {
        question: "How much should I budget for a used SUV?",
        answer:
          "Many buyers find solid used compact SUVs between $18,000 and $28,000. Midsize and three-row models usually cost more. Set a ceiling in our price filter, factor in taxes and fees, and compare certified pre-owned options against standard used listings for added warranty value.",
      },
      {
        question: "Do I need all-wheel drive on an SUV?",
        answer:
          "Front-wheel drive is sufficient for most suburban and highway driving. All-wheel drive helps in snow, rain, and light off-road conditions. If you live in a region with harsh winters or regularly drive unpaved roads, AWD is worth the upgrade. Otherwise, FWD can save money on purchase price and fuel.",
      },
      {
        question: "Which SUVs hold their value best?",
        answer:
          "Toyota, Honda, and Subaru models such as the RAV4, CR-V, and Outback historically retain value well thanks to strong reliability reputations. Domestic brands can offer more features per dollar upfront. Compare total cost of ownership, not just the purchase price, when choosing a model.",
      },
      {
        question: "Can I filter SUV listings by dealer rating?",
        answer:
          "Yes. Use state and rating filters alongside body style to prioritize dealerships with higher combined review scores. Each vehicle listing links to the seller profile where you can read aggregated ratings before you call or visit.",
      },
    ],
  },
  Sedan: {
    key: "Sedan",
    label: "Sedan",
    h1: "Sedans for Sale - Browse Sedans from Trusted Dealers",
    subtitle:
      "Search new and used sedans nationwide from verified dealerships. Compare compact, midsize, and luxury sedans by price, year, mileage, and dealer reputation.",
    badge: "Sedan Inventory",
    searchSubmitLabel: "Search Sedans",
    metaTitle: "Sedans for Sale Nationwide | AutoSalesReviews",
    metaDescription:
      "Browse sedans for sale from trusted dealerships across the US. Compare prices, read reviews and find your next sedan.",
    keywords: [
      "shop sedans nationwide",
      "used midsize sedan inventory",
      "compact sedan dealer listings",
      "fuel efficient sedan search",
      "compare sedan prices by state",
      "family sedan inventory nationwide",
    ],
    seoContent: {
      blocks: [
        {
          type: "h2",
          content: ["How to shop sedans for sale with confidence"],
        },
        {
          type: "p",
          content: [
            "Sedans remain a smart choice for drivers who want efficient commuting, comfortable highway miles, and straightforward parking in tight spaces. From fuel-sipping compact models to quiet midsize cruisers, ",
            link("sedans for sale", vehicleCategoryHref("Sedan")),
            " on AutoSalesReviews connect you with inventory from ",
            link("trusted car dealers", ROUTES.dealers),
            " in every region. Filter by make, model year, price, and mileage, then open any listing for photos, specifications, and a direct line to the selling dealership. Review scores help you avoid stores with patterns of hidden fees or weak service follow-through.",
          ],
        },
        {
          type: "h3",
          content: ["What to look for when buying a sedan"],
        },
        {
          type: "p",
          content: [
            "Decide whether you need a compact sedan for city driving or a midsize model with a more spacious rear seat. Check rear legroom if you regularly carry adult passengers, and sit in the driver's seat to confirm visibility and ergonomics. On used sedans, prioritize maintenance records, tire condition, and evidence of accident repair. Transmission type matters: modern automatics are smooth and efficient, while some enthusiasts still seek manual options in sport trims. Safety ratings from NHTSA and IIHS are worth comparing, especially for family buyers. Finally, confirm technology features you rely on, such as Apple CarPlay, adaptive cruise control, or blind-spot monitoring, because trim levels vary widely within the same model line.",
          ],
        },
        {
          type: "h3",
          content: ["Sedan price ranges to expect"],
        },
        {
          type: "p",
          content: [
            "Used compact sedans such as the Honda Civic and Toyota Corolla often appear between $12,000 and $22,000 depending on age and miles. Midsize used sedans like the Honda Accord and Toyota Camry commonly fall in the $18,000 to $32,000 range. New sedans start near $22,000 for well-equipped compacts and climb past $40,000 for premium trims. Luxury sedans from BMW or Mercedes-Benz can run higher on both new and used markets. Use our price filters to stay within budget, and sort by lowest mileage when you want newer technology without paying for a brand-new model year.",
          ],
        },
        {
          type: "h3",
          content: ["Popular sedan makes and models"],
        },
        {
          type: "p",
          content: [
            "Top searches include Honda Civic and Accord, Toyota Corolla and Camry, Hyundai Elantra and Sonata, Nissan Altima, Kia K5, and Mazda3. Each offers a different balance of reliability, ride comfort, and warranty coverage. Honda and Toyota lead long-term dependability conversations, while Hyundai and Kia often deliver strong feature content for the money. If you need more ground clearance or cargo flexibility, compare ",
            link("SUVs", vehicleCategoryHref("SUV")),
            " or ",
            link("electric sedans", vehicleCategoryHref("Electric")),
            " before you finalize a body style. Performance-oriented shoppers may cross-shop ",
            link("luxury sedans", vehicleCategoryHref("Luxury")),
            " with sport-tuned suspensions and premium interiors.",
          ],
        },
        {
          type: "h3",
          content: ["Tips for sedan buyers"],
        },
        {
          type: "p",
          content: [
            "Request a vehicle history report and a pre-purchase inspection on any used sedan that interests you. Compare financing offers from the dealer against your bank or credit union so you understand the full cost of borrowing. Read dealer reviews before you negotiate, and ask for an out-the-door quote in writing that lists every fee. Sedans depreciate at different rates by brand, so a slightly higher purchase price on a reliable model can cost less over five years of ownership. When your search is ready, browse ",
            link("cars for sale nationwide", ROUTES.vehicles),
            " or narrow to sedans in your state to find local test-drive options.",
          ],
        },
      ],
    },
    faqs: [
      {
        question: "Are sedans cheaper to own than SUVs?",
        answer:
          "Sedans often cost less to purchase, fuel, and insure because they are lighter and typically use smaller engines. Maintenance costs depend on the brand and model, but compact and midsize sedans from mainstream brands are usually among the most affordable vehicles to run over time.",
      },
      {
        question: "What is the most reliable used sedan to buy?",
        answer:
          "Honda Civic, Honda Accord, Toyota Corolla, and Toyota Camry consistently rank among the most reliable used sedans. Always review maintenance history and get an independent inspection, because condition matters as much as the badge on the trunk.",
      },
      {
        question: "Should I buy a new or used sedan?",
        answer:
          "New sedans offer the latest safety tech and full factory warranty. Used sedans deliver lower upfront cost and slower depreciation on many models. If you drive fewer than 12,000 miles per year, a two- to four-year-old used sedan often provides the best value.",
      },
      {
        question: "How do I compare sedan trim levels?",
        answer:
          "Focus on the features you will use daily: advanced driver assistance, leather versus cloth, engine size, and wheel size. Higher trims add comfort and tech but also raise price and sometimes insurance cost. Filter by year and price, then read listing details for trim-specific equipment.",
      },
      {
        question: "Where can I read reviews of sedan dealers near me?",
        answer:
          "Each listing on AutoSalesReviews links to the selling dealership profile with aggregated review scores. You can also browse our dealer directory by city or state to compare multiple stores before you schedule a test drive.",
      },
    ],
  },
  Truck: {
    key: "Truck",
    label: "Truck",
    h1: "Trucks for Sale - New and Used Trucks Nationwide",
    subtitle:
      "Find light-duty, midsize, and heavy-duty trucks from rated dealerships across the country. Filter by cab style, price, mileage, and drivetrain to match work and daily-driving needs.",
    badge: "Truck Inventory",
    searchSubmitLabel: "Search Trucks",
    metaTitle: "Trucks for Sale Nationwide | AutoSalesReviews",
    metaDescription:
      "Browse trucks for sale from trusted dealerships across the US. Compare prices, read reviews and find your next truck.",
    keywords: [
      "shop pickup trucks nationwide",
      "used F-150 Silverado inventory",
      "light duty truck dealer listings",
      "work truck inventory search",
      "compare truck towing capacity",
      "4x4 truck listings by state",
    ],
    seoContent: {
      blocks: [
        {
          type: "h2",
          content: ["Find the right pickup truck from a dealer you can trust"],
        },
        {
          type: "p",
          content: [
            "Pickup trucks serve dual roles as daily drivers and work tools, which makes matching cab size, bed length, engine, and towing capacity essential before you buy. Search ",
            link("trucks for sale", vehicleCategoryHref("Truck")),
            " from ",
            link("rated dealerships", ROUTES.dealers),
            " nationwide on AutoSalesReviews, then filter by price, mileage, condition, and location. Whether you need a midsize truck for easier parking or a full-size model for towing a trailer, our inventory search surfaces listings with dealer contact info and review scores so you know who you are buying from before you arrive on the lot.",
          ],
        },
        {
          type: "h3",
          content: ["What to look for when buying a truck"],
        },
        {
          type: "p",
          content: [
            "Start with how you will use the truck. Midsize models like the Toyota Tacoma and Ford Ranger fit many buyers who want capability without full-size dimensions. Half-ton trucks such as the Ford F-150, Chevrolet Silverado 1500, and Ram 1500 cover most towing and payload needs for personal use. Heavy-duty variants step up when you regularly haul heavy equipment or large trailers. Compare cab configurations: regular cabs suit work fleets, extended and crew cabs add rear seating for family use. Check bed length against what you haul, inspect frame and bed for rust on used trucks, and verify tow ratings with the exact engine and axle ratio on the window sticker or build sheet.",
          ],
        },
        {
          type: "h3",
          content: ["Truck price ranges to expect"],
        },
        {
          type: "p",
          content: [
            "Used midsize trucks often list from the high teens to low $30,000s. Used half-ton pickups commonly range from $25,000 to $55,000 depending on trim, four-wheel drive, and mileage. New trucks span roughly $35,000 for basic midsize models to $80,000 or more for loaded full-size premium trims. Diesel engines and heavy-duty models sit at the top of the market. Set a price ceiling in our filters and compare similarly equipped trucks rather than base models against fully loaded listings. Remember that lift kits, aftermarket wheels, or dealer-installed accessories may affect warranty coverage on used inventory.",
          ],
        },
        {
          type: "h3",
          content: ["Popular truck makes and models"],
        },
        {
          type: "p",
          content: [
            "Ford F-150 leads full-size sales conversations, followed by Chevrolet Silverado, Ram 1500, GMC Sierra, Toyota Tundra, and Nissan Titan. Midsize shoppers search Toyota Tacoma, Ford Ranger, Chevrolet Colorado, and Jeep Gladiator. Each lineup offers different infotainment, towing tech, and available hybrid or diesel powertrains. Filter by make to focus your search, or explore ",
            link("SUVs", vehicleCategoryHref("SUV")),
            " if you need enclosed cargo space more often than an open bed. Contractors and small-business owners should also compare dealer reviews in their area for stores known for fleet pricing and service bays.",
          ],
        },
        {
          type: "h3",
          content: ["Tips for truck shoppers"],
        },
        {
          type: "p",
          content: [
            "Bring the trailer or payload you plan to tow or haul when you test drive, if possible, so you feel real-world acceleration and braking. Ask for maintenance records on used trucks, especially on models with turbo engines or high towing history. Compare lease and finance terms carefully on new trucks, where incentives change frequently by brand. Read dealer reviews and confirm the out-the-door price includes any documentation or nitrogen tire fees before you sign. For alternative body styles with similar utility, browse ",
            link("minivans", vehicleCategoryHref("Minivan")),
            " or ",
            link("all vehicle inventory", ROUTES.vehicles),
            " to make sure a pickup is the best fit for your lifestyle.",
          ],
        },
      ],
    },
    faqs: [
      {
        question: "What size truck do I need for everyday driving?",
        answer:
          "Midsize trucks suit drivers who want pickup utility with easier parking and better fuel economy. Half-ton full-size trucks fit most personal towing and hauling needs. Heavy-duty trucks make sense when you regularly exceed half-ton payload or towing limits.",
      },
      {
        question: "How much towing capacity do I need?",
        answer:
          "Match capacity to your heaviest expected load plus a safety margin. A half-ton truck with the right engine and tow package often handles boats, campers, and car trailers for personal use. Verify the specific truck configuration, because tow ratings change by engine, axle, and equipment.",
      },
      {
        question: "Are used trucks a good value?",
        answer:
          "Used trucks can offer strong value, especially when buying from a dealer who provides history reports and reconditioning. Inspect for frame rust, bed damage, and signs of heavy commercial use. Certified pre-owned trucks from major brands may include extended powertrain coverage.",
      },
      {
        question: "Should I choose four-wheel drive on a truck?",
        answer:
          "Four-wheel drive helps in snow, mud, and off-road work sites. Rear-wheel drive or four-by-two models cost less and may achieve better fuel economy. Choose based on climate and how often you leave paved roads, not on appearance alone.",
      },
      {
        question: "Can I search trucks by dealer location and rating?",
        answer:
          "Yes. Add a state filter or browse dealers in our directory, then return to truck listings filtered by location. Each result shows the selling dealer and links to their review profile.",
      },
    ],
  },
  Electric: {
    key: "Electric",
    label: "Electric",
    h1: "Electric Cars for Sale - EVs from Trusted Dealers",
    subtitle:
      "Shop new and used electric vehicles from verified dealerships nationwide. Compare battery range, charging options, pricing, and dealer ratings in one search.",
    badge: "Electric Vehicles",
    searchSubmitLabel: "Search EVs",
    metaTitle: "Electric Cars for Sale Nationwide | AutoSalesReviews",
    metaDescription:
      "Browse electric cars for sale from trusted dealerships across the US. Compare prices, read reviews and find your next electric car.",
    keywords: [
      "shop electric cars nationwide",
      "used Tesla EV inventory",
      "battery electric vehicle listings",
      "EV range comparison by model",
      "hybrid and electric dealer inventory",
      "charge-ready EV search by state",
    ],
    seoContent: {
      blocks: [
        {
          type: "h2",
          content: ["Buying an electric car from a trusted dealership"],
        },
        {
          type: "p",
          content: [
            "Electric vehicles are no longer a niche category. Mainstream dealers now stock battery-electric models from Tesla, Hyundai, Kia, Ford, Chevrolet, BMW, and others alongside growing used EV inventory. Browse ",
            link("electric cars for sale", vehicleCategoryHref("Electric")),
            " on AutoSalesReviews to compare range, price, and condition from ",
            link("verified dealerships", ROUTES.dealers),
            " across the US. Each listing includes dealer contact details and review scores, helping you choose a seller who supports EV buyers with transparent pricing and knowledgeable staff, not just internal-combustion sales experience.",
          ],
        },
        {
          type: "h3",
          content: ["What to look for when buying an EV"],
        },
        {
          type: "p",
          content: [
            "Range is the first number most shoppers check, but charging speed and home charging access matter just as much. Confirm EPA-rated range for the trim you are considering and ask how the vehicle was charged and stored on used models. Battery health reports and remaining factory battery warranty coverage should be part of every used EV conversation. Inspect charging port type: most new EVs use CCS or NACS (Tesla-compatible) depending on brand and model year. Interior tech, heat-pump availability for cold climates, and driver-assistance packages vary by trim. If you cannot charge at home, map public fast chargers along your regular routes before you commit to a specific model.",
          ],
        },
        {
          type: "h3",
          content: ["Electric vehicle price ranges to expect"],
        },
        {
          type: "p",
          content: [
            "Used EVs now appear at many price points, with older compact models sometimes listing below $20,000 and newer long-range crossovers commonly between $30,000 and $55,000. New EVs span roughly $30,000 for entry models to $70,000 or more for premium performance trims. Federal and state incentives may apply on qualifying new purchases; ask the dealer which credits transfer on used EVs in your state. Because EV technology evolves quickly, compare model year and software update history, not just mileage. Setting a price filter and sorting by newest model year helps surface recent inventory with updated range and charging capabilities.",
          ],
        },
        {
          type: "h3",
          content: ["Popular electric makes and models"],
        },
        {
          type: "p",
          content: [
            "Shoppers frequently search Tesla Model 3 and Model Y, Hyundai Ioniq 5 and Ioniq 6, Kia EV6 and Niro EV, Ford Mustang Mach-E and F-150 Lightning, Chevrolet Bolt EUV, BMW i4 and iX, and Volkswagen ID.4. Each offers different charging curves, interior space, and warranty terms. Tesla leads public fast-charging network access in many regions, while other brands rely on growing CCS and adapter solutions. Cross-shop ",
            link("luxury electric models", vehicleCategoryHref("Luxury")),
            " if you want premium interiors, or ",
            link("SUVs", vehicleCategoryHref("SUV")),
            " if you prefer to compare electric and gas-powered crossovers in one place.",
          ],
        },
        {
          type: "h3",
          content: ["Tips for EV shoppers"],
        },
        {
          type: "p",
          content: [
            "Schedule a test drive that includes highway speeds and, if possible, a fast-charging session so you understand real-world consumption. Ask the dealer for battery warranty transfer details and any diagnostic report available on used inventory. Compare total cost of ownership: lower fuel and maintenance costs offset higher purchase prices for many drivers. Read dealer reviews to find stores with dedicated EV specialists. When you are ready to broaden your search, visit our main ",
            link("vehicle search", ROUTES.vehicles),
            " or explore ",
            link("sedans", vehicleCategoryHref("Sedan")),
            " and ",
            link("trucks", vehicleCategoryHref("Truck")),
            " if a plug-in or hybrid alternative fits your driving pattern better.",
          ],
        },
      ],
    },
    faqs: [
      {
        question: "How do I know if an EV battery is still healthy?",
        answer:
          "Ask the dealer for any available battery health diagnostic or state-of-health report. Review remaining factory battery warranty coverage by model year and mileage. A test drive that includes highway speeds helps reveal unexpected range loss, though professional diagnostics are most reliable.",
      },
      {
        question: "Can I charge an electric car if I live in an apartment?",
        answer:
          "Many apartment dwellers rely on workplace charging or public Level 2 and DC fast chargers near home. Map chargers along your regular routes before buying. If you cannot charge conveniently, a plug-in hybrid or efficient gas vehicle may fit better until home charging becomes available.",
      },
      {
        question: "Are used electric cars worth buying?",
        answer:
          "Used EVs can offer strong value, especially when battery warranty coverage remains. Prices vary with model year and range more than with traditional used cars. Compare battery warranty terms and charging speed against newer models before you decide.",
      },
      {
        question: "What range do I need in an electric car?",
        answer:
          "Add your longest regular round trip, then include a buffer for cold weather and highway driving, which reduce range. Many commuters do well with 220 or more miles of EPA-rated range. Frequent road-trippers should prioritize fast-charging capability and network access along their routes.",
      },
      {
        question: "Do dealers on AutoSalesReviews list both new and used EVs?",
        answer:
          "Yes. Filter by condition to compare new and used electric inventory. Each listing connects to a dealer profile where you can read reviews and contact the store directly.",
      },
    ],
  },
  Luxury: {
    key: "Luxury",
    label: "Luxury",
    h1: "Luxury Cars for Sale - Premium Vehicles Nationwide",
    subtitle:
      "Discover premium sedans, SUVs, and electric models from BMW, Mercedes-Benz, Tesla, and other luxury brands listed by trusted dealerships nationwide.",
    badge: "Luxury Inventory",
    searchSubmitLabel: "Search Luxury Cars",
    metaTitle: "Luxury Cars for Sale Nationwide | AutoSalesReviews",
    metaDescription:
      "Browse luxury cars for sale from trusted dealerships across the US. Compare prices, read reviews and find your next luxury car.",
    keywords: [
      "shop luxury cars nationwide",
      "used BMW Mercedes inventory",
      "certified pre-owned luxury listings",
      "premium vehicle dealer search",
      "compare luxury sedan and SUV prices",
      "high-end auto inventory by state",
    ],
    seoContent: {
      blocks: [
        {
          type: "h2",
          content: ["Shop luxury cars with dealer reviews you can trust"],
        },
        {
          type: "p",
          content: [
            "Luxury vehicles deliver refined interiors, advanced technology, and performance-oriented engineering, but they also require careful shopping because options, maintenance costs, and warranty coverage vary widely by brand and model year. Search ",
            link("luxury cars for sale", vehicleCategoryHref("Luxury")),
            " from ",
            link("trusted dealerships", ROUTES.dealers),
            " on AutoSalesReviews to compare BMW, Mercedes-Benz, Tesla, and other premium inventory nationwide. Our listings highlight dealer ratings so you can prioritize stores known for transparent pricing, professional delivery experiences, and strong certified pre-owned programs.",
          ],
        },
        {
          type: "h3",
          content: ["What to look for when buying a luxury car"],
        },
        {
          type: "p",
          content: [
            "Define whether you want a luxury sedan, SUV, or electric model before you filter results. Certified pre-owned programs from premium brands often include extended warranties and multi-point inspections that reduce risk on used purchases. Review service history carefully: luxury vehicles can carry higher maintenance costs once factory coverage expires. Check for common wear on leather, electronics, and air suspension components on older models. Driver-assistance packages and premium audio systems are often bundled in higher trims, so compare equipment lists rather than assuming a badge alone guarantees every feature. A pre-purchase inspection from a shop familiar with the brand is money well spent on used luxury inventory.",
          ],
        },
        {
          type: "h3",
          content: ["Luxury car price ranges to expect"],
        },
        {
          type: "p",
          content: [
            "Used luxury sedans and crossovers often start in the mid-$20,000s for older model years and climb past $60,000 for late-model, low-mileage examples. New luxury vehicles typically begin around $45,000 for entry trims and exceed $100,000 for high-performance or full-size SUV flagships. Tesla and European brands may depreciate at different rates, which creates opportunities for value-focused buyers who prioritize features over the newest model year. Use price filters to stay within budget, and remember that insurance, premium fuel or charging, and maintenance run higher than on mainstream brands.",
          ],
        },
        {
          type: "h3",
          content: ["Popular luxury makes and models"],
        },
        {
          type: "p",
          content: [
            "BMW 3 Series and X5, Mercedes-Benz C-Class and GLE, Tesla Model 3 and Model Y, Audi A4 and Q5, Lexus ES and RX, and Porsche Macan appear frequently in luxury searches. Each brand emphasizes different strengths: BMW and Mercedes lead traditional premium interiors, Tesla leads software and charging integration, and Lexus is known for reliability-focused luxury. Cross-shop ",
            link("electric cars", vehicleCategoryHref("Electric")),
            ", ",
            link("SUVs", vehicleCategoryHref("SUV")),
            ", and ",
            link("sedans", vehicleCategoryHref("Sedan")),
            " if you have not settled on body style yet.",
          ],
        },
        {
          type: "h3",
          content: ["Tips for luxury car buyers"],
        },
        {
          type: "p",
          content: [
            "Negotiate on total out-the-door price and ask which fees are mandatory versus optional add-ons. Compare certified pre-owned pricing against independent used listings to see whether warranty value justifies the premium. Read dealer reviews and favor stores with consistent praise for professionalism and after-sale support. Request a detailed equipment list and verify window-sticker or build-sheet data on used models. When you are ready to act, contact the dealer from the listing page or browse ",
            link("cars for sale nationwide", ROUTES.vehicles),
            " to compare luxury and non-luxury options side by side.",
          ],
        },
      ],
    },
    faqs: [
      {
        question: "Is it better to buy a certified pre-owned luxury car?",
        answer:
          "Certified pre-owned luxury vehicles often include extended warranties, roadside assistance, and rigorous inspections. They cost more than standard used inventory but can reduce surprise repair bills. Compare CPO pricing against remaining factory warranty on non-certified used models.",
      },
      {
        question: "Which luxury brands cost the most to maintain?",
        answer:
          "European luxury brands and performance models typically carry higher maintenance and repair costs after warranty expiration. Research scheduled service pricing for the specific model you want and budget accordingly before you buy.",
      },
      {
        question: "Do luxury cars depreciate faster than mainstream models?",
        answer:
          "Many luxury vehicles depreciate quickly in the first few years, which can benefit used buyers. Depreciation varies by brand, model, and market demand. Tesla and some popular SUVs hold value differently than sedans from the same brand.",
      },
      {
        question: "Can I finance a used luxury car through the dealer?",
        answer:
          "Most dealerships offer financing on used and certified pre-owned luxury inventory. Compare the dealer rate with your bank or credit union, and check whether the lender has mileage or age limits that affect approval on older luxury models.",
      },
      {
        question: "How does AutoSalesReviews define luxury inventory?",
        answer:
          "Our luxury category highlights premium brands such as BMW, Mercedes-Benz, and Tesla. Use additional filters for price, year, and body style to narrow results to the specific luxury segment you want to shop.",
      },
    ],
  },
  Minivan: {
    key: "Minivan",
    label: "Minivan",
    h1: "Minivans for Sale - Family Vans from Trusted Dealers",
    subtitle:
      "Find new and used minivans built for families from top-rated dealerships nationwide. Compare Honda Odyssey, Toyota Sienna, Chrysler Pacifica, and more by price and mileage.",
    badge: "Minivan Inventory",
    searchSubmitLabel: "Search Minivans",
    metaTitle: "Minivans for Sale Nationwide | AutoSalesReviews",
    metaDescription:
      "Browse minivans for sale from trusted dealerships across the US. Compare prices, read reviews and find your next minivan.",
    keywords: [
      "shop minivans nationwide",
      "used Honda Odyssey inventory",
      "Toyota Sienna dealer listings",
      "family van inventory search",
      "sliding door minivan listings",
      "compare minivan prices by state",
    ],
    seoContent: {
      blocks: [
        {
          type: "h2",
          content: ["Why minivans remain the smartest family vehicle buy"],
        },
        {
          type: "p",
          content: [
            "Minivans maximize passenger space, sliding-door convenience, and cargo flexibility in ways many three-row SUVs struggle to match. If you carpool, haul sports gear, or road-trip with kids, ",
            link("minivans for sale", vehicleCategoryHref("Minivan")),
            " from ",
            link("top-rated dealerships", ROUTES.dealers),
            " deserve a serious look. AutoSalesReviews lets you filter by price, mileage, and model year, then connect with sellers through profiles that include verified review scores. That combination helps family buyers choose both the right van and the right dealer before anyone climbs into the third row.",
          ],
        },
        {
          type: "h3",
          content: ["What to look for when buying a minivan"],
        },
        {
          type: "p",
          content: [
            "Count the seats you need today and a few years from now. Most minivans offer seven or eight-passenger layouts with removable or fold-flat second- and third-row seats. Check sliding-door operation, especially on used models, and test rear climate controls if passengers sit in the back regularly. Safety features such as blind-spot monitoring and rear cross-traffic alert are valuable in parking lots. Hybrid minivans like the Toyota Sienna deliver strong fuel economy for families who drive long distances. Inspect upholstery and rear cargo areas for wear from child seats and strollers, and confirm LATCH anchor accessibility in the rows where you install car seats.",
          ],
        },
        {
          type: "h3",
          content: ["Minivan price ranges to expect"],
        },
        {
          type: "p",
          content: [
            "Used minivans often list between $18,000 and $35,000 depending on brand, year, and mileage. New minivans typically start in the mid-$30,000s and climb past $50,000 for top trims with premium entertainment and driver-assistance packages. Because minivans are often kept for many years, maintenance history matters: timing belt or chain service, transmission care, and tire condition should be reviewed on any used candidate. Set a budget with our price filter and compare similarly equipped vans rather than base models against loaded Pacifica or Odyssey trims.",
          ],
        },
        {
          type: "h3",
          content: ["Popular minivan makes and models"],
        },
        {
          type: "p",
          content: [
            "Honda Odyssey, Toyota Sienna, Chrysler Pacifica, and Kia Carnival dominate most family van searches. Odyssey is known for driving refinement, Sienna offers available hybrid efficiency, Pacifica adds available plug-in hybrid capability and Stow 'n Go seating, and Carnival brings competitive pricing and warranty coverage. Families debating a minivan versus an SUV should compare ",
            link("three-row SUVs", vehicleCategoryHref("SUV")),
            " for ground clearance and towing needs, then return to minivan listings if interior access and cargo volume matter more.",
          ],
        },
        {
          type: "h3",
          content: ["Tips for minivan shoppers"],
        },
        {
          type: "p",
          content: [
            "Bring car seats or strollers when you test drive to confirm fit and ease of installation. Ask about remaining factory warranty and any open recalls on used models. Read dealer reviews to find family-friendly stores with clear pricing and service departments that handle busy schedules. Compare out-the-door quotes and ask whether floor mats, roof racks, or entertainment packages are included or extra. When you need broader options, browse ",
            link("all cars for sale", ROUTES.vehicles),
            " or explore dealers near you for local inventory and test-drive appointments.",
          ],
        },
      ],
    },
    faqs: [
      {
        question: "Are minivans safer than three-row SUVs?",
        answer:
          "Both minivans and three-row SUVs can offer strong crash-test results when equipped with modern safety technology. Minivans often provide lower step-in height and better third-row access. Compare specific model safety ratings and features rather than body style alone.",
      },
      {
        question: "Which minivan is best for large families?",
        answer:
          "Honda Odyssey, Toyota Sienna, Chrysler Pacifica, and Kia Carnival all offer flexible seating for seven or eight passengers. Compare third-row legroom, cargo space with all seats up, and sliding-door width if you load children daily.",
      },
      {
        question: "Do minivans hold their value?",
        answer:
          "Minivans depreciate similarly to many family SUVs, though demand spikes before school years and holiday travel seasons. Toyota and Honda models often retain value well. Buying used can deliver strong value because many vans are sold after families outgrow them.",
      },
      {
        question: "Should I choose a hybrid minivan?",
        answer:
          "Hybrid minivans like the Toyota Sienna can significantly reduce fuel costs for drivers who rack up miles on school runs and road trips. Compare upfront price against expected fuel savings over your ownership period and confirm battery warranty terms.",
      },
      {
        question: "Can I filter minivan listings by dealer rating?",
        answer:
          "Yes. Use state and rating filters together with the minivan body style to prioritize highly rated dealerships. Each listing links to the seller profile with aggregated review scores.",
      },
    ],
  },
};

export function getVehicleCategoryConfig(
  bodyStyle: string | undefined
): VehicleCategoryConfig | null {
  if (!bodyStyle) return null;
  return VEHICLE_CATEGORIES[bodyStyle as VehicleCategoryKey] ?? null;
}

export function isVehicleCategoryKey(
  value: string
): value is VehicleCategoryKey {
  return value in VEHICLE_CATEGORIES;
}
