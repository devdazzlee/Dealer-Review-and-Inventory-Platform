import { PrismaClient } from "@prisma/client";
import { generateSlug } from "../src/utils/slug";
import { calculateCombinedRating } from "../src/utils/rating";
import { REVIEW_STATUS } from "../src/config/constants";

const prisma = new PrismaClient();

const reviewComments = [
  {
    title: "Smooth buying experience",
    comment:
      "Great experience buying my car here. Staff was friendly and helpful from the first phone call through delivery.",
  },
  {
    title: "Fair pricing, no pressure",
    comment:
      "Fair pricing and no pressure sales tactics. Would recommend this dealership to anyone shopping for a reliable vehicle.",
  },
  {
    title: "Quick service department",
    comment:
      "Service department was quick and professional. They explained every item on the invoice before starting work.",
  },
  {
    title: "Found exactly what I wanted",
    comment:
      "Found exactly what I was looking for. Smooth transaction with transparent paperwork and clear out-the-door pricing.",
  },
  {
    title: "Good selection overall",
    comment:
      "Decent selection but wait times were a bit long on a Saturday. Still happy with the vehicle and the follow-up.",
  },
  {
    title: "Excellent customer service",
    comment:
      "Excellent customer service from start to finish. The finance team made every option easy to understand.",
  },
  {
    title: "Happy with my used car",
    comment:
      "Good deals on used vehicles. Happy with my purchase and the 30-day exchange policy gave me peace of mind.",
  },
  {
    title: "Finance made it easy",
    comment:
      "The finance team made everything easy to understand. No last-minute add-ons I did not ask for.",
  },
  {
    title: "Clean showroom and staff",
    comment:
      "Clean showroom and knowledgeable sales staff. Test drive was easy to schedule and very accommodating.",
  },
  {
    title: "Paperwork issues resolved",
    comment:
      "Had some issues with paperwork but they resolved it quickly and kept me updated the entire time.",
  },
  {
    title: "Best dealership in years",
    comment:
      "Best dealership experience I've had in years. Honest answers about vehicle history and service costs.",
  },
  {
    title: "Quality over quantity",
    comment:
      "Inventory was limited but quality was top notch. Would definitely come back for my next vehicle.",
  },
];

const authors = [
  { name: "John Davis", email: "john.davis" },
  { name: "Sarah Mitchell", email: "sarah.mitchell" },
  { name: "Mike Rivera", email: "mike.rivera" },
  { name: "Lisa Chen", email: "lisa.chen" },
  { name: "David Park", email: "david.park" },
  { name: "Emily Torres", email: "emily.torres" },
  { name: "Chris Walker", email: "chris.walker" },
  { name: "Amanda Brooks", email: "amanda.brooks" },
  { name: "Robert Hayes", email: "robert.hayes" },
  { name: "Jennifer Lopez", email: "jennifer.lopez" },
];

const visitTypes = [
  "Purchased New Car",
  "Purchased Used Car",
  "Service Visit",
  "Just Looking",
] as const;

function hash(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

function randomBetween(h: number, min: number, max: number): number {
  return min + (h % (max - min + 1));
}

function clampRating(value: number): number {
  return Math.min(5, Math.max(1, Math.round(value * 10) / 10));
}

function buildExternalRatings(seed: string) {
  const h = hash(seed);
  const base = 3.8 + (h % 12) / 10;
  return {
    googleRating: clampRating(base + 0.1),
    googleReviewCount: 40 + (h % 180),
    yelpRating: clampRating(base - 0.2),
    yelpReviewCount: 20 + (h % 90),
    carfaxRating: clampRating(base + 0.2),
    autoSalesReviewsRating: h % 5 === 0 ? clampRating(base + 0.4) : null,
  };
}

function buildApprovedReviews(dealerSlug: string, count: number) {
  const shuffled = [...reviewComments].sort(
    (a, b) => hash(dealerSlug + a.title) - hash(dealerSlug + b.title)
  );

  return Array.from({ length: count }, (_, i) => {
    const author = authors[i % authors.length];
    const content = shuffled[i % shuffled.length];
    const h = hash(`${dealerSlug}-${i}`);
    const overall = 4 + (h % 2);
    const daysAgo = 10 + (h % 200);

    return {
      authorName: author.name,
      email: `${author.email}.${dealerSlug}@example.com`,
      overallRating: overall,
      customerServiceRating: Math.min(5, overall + (h % 2 === 0 ? 0 : -1)),
      qualityRating: overall,
      friendlinessRating: Math.min(5, overall + 1),
      pricingRating: Math.max(3, overall - (h % 2)),
      recommend: overall >= 4,
      title: content.title,
      comment: content.comment,
      visitDate: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      visitType: visitTypes[h % visitTypes.length],
      status: REVIEW_STATUS.approved,
      helpfulCount: h % 15,
      notHelpfulCount: h % 3,
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    };
  });
}

interface SeedDealer {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  featured?: boolean;
  hasBadge?: boolean;
  badgeYear?: number;
}

function dealer(
  name: string,
  city: string,
  state: string,
  zip: string,
  address: string,
  phone: string,
  description: string,
  featured = false
): SeedDealer {
  const slug = generateSlug(name);
  return {
    name,
    address,
    city,
    state,
    zip,
    phone,
    email: `sales@${slug}.com`,
    website: `https://${slug}.com`,
    description,
    featured,
  };
}

/** Dealers aligned with frontend SEO target cities (2–3 per city). */
const dealers: SeedDealer[] = [
  // Priority dealer — always first in listings
  {
    ...dealer(
      "Bergen Car",
      "Hackensack",
      "NJ",
      "07601",
      "100 Main Street",
      "(201) 555-0100",
      "Bergen Car is our flagship New Jersey dealership known for transparent pricing and outstanding customer care.",
      true
    ),
    hasBadge: true,
    badgeYear: 2026,
  },
  // New York
  dealer("Manhattan Motors", "New York", "NY", "10001", "1200 Broadway", "(212) 555-0200", "Premium vehicles in Midtown Manhattan.", true),
  dealer("Empire City Auto", "New York", "NY", "10019", "850 7th Avenue", "(212) 555-0201", "Trusted Manhattan dealership with transparent pricing."),
  dealer("Broadway Auto Gallery", "New York", "NY", "10036", "1560 Broadway", "(212) 555-0202", "Sedans, SUVs, and hybrids near Times Square."),
  dealer("Brooklyn Auto Exchange", "Brooklyn", "NY", "11217", "450 Atlantic Ave", "(718) 555-0210", "Family-owned Brooklyn dealership since 1985.", true),
  dealer("Kings County Motors", "Brooklyn", "NY", "11201", "180 Flatbush Ave", "(718) 555-0211", "Value-focused inventory for Brooklyn drivers."),
  dealer("Queens Car Center", "Queens", "NY", "11354", "78 Northern Blvd", "(718) 555-0220", "Flushing neighborhood dealer.", true),
  dealer("LaGuardia Auto Sales", "Queens", "NY", "11371", "9200 Ditmars Blvd", "(718) 555-0221", "Certified pre-owned near LGA."),
  dealer("Bronx Auto World", "Bronx", "NY", "10451", "900 Grand Concourse", "(718) 555-0230", "New and used cars on the Grand Concourse.", true),
  dealer("Fordham Motors", "Bronx", "NY", "10458", "2400 Grand Concourse", "(718) 555-0231", "Flexible financing for Bronx buyers."),
  // New Jersey
  dealer("Newark Auto Center", "Newark", "NJ", "07102", "500 Market Street", "(973) 555-0300", "Newark dealer near Penn Station.", true),
  dealer("Ironbound Motor Group", "Newark", "NJ", "07105", "120 Ferry Street", "(973) 555-0301", "Serving Ironbound and Essex County."),
  dealer("Gateway City Motors", "Newark", "NJ", "07104", "880 Broad Street", "(973) 555-0302", "Inventory for North Jersey commuters."),
  dealer("Hudson Auto Group", "Jersey City", "NJ", "07302", "250 River Road", "(201) 555-0310", "Hudson waterfront full-service dealer.", true),
  dealer("Journal Square Motors", "Jersey City", "NJ", "07306", "1 Journal Square Plaza", "(201) 555-0311", "Easy access for PATH commuters."),
  dealer("Garden State Motors", "Paramus", "NJ", "07652", "88 Route 17", "(201) 555-0320", "Route 17 auto row mega selection.", true),
  dealer("Paramus Auto Mall", "Paramus", "NJ", "07652", "650 Route 17 North", "(201) 555-0321", "Trucks, SUVs, and sedans in Paramus."),
  dealer("Hackensack Auto Plaza", "Hackensack", "NJ", "07601", "200 Main Street", "(201) 555-0330", "Bergen County certified service.", true),
  dealer("Bergen Motor Works", "Hackensack", "NJ", "07601", "450 Hackensack Ave", "(201) 555-0331", "Trusted Hackensack dealer 30+ years."),
  // Pennsylvania
  dealer("Philadelphia Auto Hub", "Philadelphia", "PA", "19107", "900 Market Street", "(215) 555-0400", "Center City Philadelphia dealer.", true),
  dealer("Liberty Bell Motors", "Philadelphia", "PA", "19103", "1500 Chestnut Street", "(215) 555-0401", "Certified pre-owned in Philly."),
  dealer("Schuylkill Auto Group", "Philadelphia", "PA", "19146", "2400 South Street", "(215) 555-0402", "South Philly same-day financing."),
  dealer("Pittsburgh Motors", "Pittsburgh", "PA", "15222", "200 Liberty Ave", "(412) 555-0410", "Western PA crossover specialists.", true),
  dealer("Three Rivers Auto", "Pittsburgh", "PA", "15219", "1100 Fifth Avenue", "(412) 555-0411", "AWD inventory for Pittsburgh winters."),
  dealer("Allentown Car Company", "Allentown", "PA", "18101", "410 Hamilton Street", "(610) 555-0420", "Lehigh Valley favorite.", true),
  dealer("Lehigh Valley Motors", "Allentown", "PA", "18109", "1500 Lehigh Street", "(610) 555-0421", "Between Philly and NYC markets."),
  // Connecticut
  dealer("Hartford Auto Group", "Hartford", "CT", "06103", "150 Trumbull Street", "(860) 555-0500", "Capital region auto leader.", true),
  dealer("Constitution Motors", "Hartford", "CT", "06106", "500 Albany Avenue", "(860) 555-0501", "Insurance corridor commuter specials."),
  dealer("New Haven Motors", "New Haven", "CT", "06511", "220 Chapel Street", "(203) 555-0510", "Yale area trusted dealer.", true),
  dealer("Elm City Auto", "New Haven", "CT", "06510", "800 Whalley Avenue", "(203) 555-0511", "Shoreline and campus market inventory."),
  dealer("Bridgeport Auto Sales", "Bridgeport", "CT", "06604", "900 Main Street", "(203) 555-0520", "Fairfield County value pricing.", true),
  dealer("Seaside Motor Co", "Bridgeport", "CT", "06605", "1200 Boston Avenue", "(203) 555-0521", "Family SUVs and sedans in Bridgeport."),
  // Massachusetts
  dealer("Boston Auto Exchange", "Boston", "MA", "02108", "100 Cambridge Street", "(617) 555-0600", "New England hub for new and used cars.", true),
  dealer("Back Bay Motors", "Boston", "MA", "02116", "400 Boylston Street", "(617) 555-0601", "Urban Boston dealer with winter-ready AWD."),
  dealer("Harbor City Auto", "Boston", "MA", "02110", "200 Atlantic Ave", "(617) 555-0602", "Seaport district showroom."),
  // California
  dealer("Los Angeles Auto Center", "Los Angeles", "CA", "90015", "1200 S Figueroa St", "(213) 555-0700", "Downtown LA flagship dealership.", true),
  dealer("Sunset Boulevard Motors", "Los Angeles", "CA", "90028", "6800 Sunset Blvd", "(323) 555-0701", "Hollywood area premium inventory."),
  dealer("Pacific Coast Auto", "Los Angeles", "CA", "90064", "10850 Pico Blvd", "(310) 555-0702", "West LA family dealer."),
  dealer("San Diego Auto Hub", "San Diego", "CA", "92101", "800 Broadway", "(619) 555-0710", "Coastal Southern California dealer.", true),
  dealer("Mission Valley Motors", "San Diego", "CA", "92108", "5500 Grossmont Center Dr", "(619) 555-0711", "Compact SUV specialists."),
  dealer("San Francisco Auto Group", "San Francisco", "CA", "94103", "900 Van Ness Ave", "(415) 555-0720", "EV and hybrid focused SF dealer.", true),
  dealer("Bay Area Motor Works", "San Francisco", "CA", "94110", "2200 Mission Street", "(415) 555-0721", "City-friendly compact inventory."),
  dealer("San Jose Silicon Motors", "San Jose", "CA", "95113", "200 S Market St", "(408) 555-0730", "Silicon Valley EV and tech-trim specialist.", true),
  dealer("Capitol Auto San Jose", "San Jose", "CA", "95126", "1400 The Alameda", "(408) 555-0731", "South Bay certified pre-owned leader."),
  // Illinois
  dealer("Chicago Auto Plaza", "Chicago", "IL", "60601", "500 N Michigan Ave", "(312) 555-0800", "Loop Chicago full-line dealer.", true),
  dealer("Windy City Motors", "Chicago", "IL", "60614", "2400 N Clybourn Ave", "(773) 555-0801", "AWD and SUV winter specialists."),
  dealer("Lakefront Auto Group", "Chicago", "IL", "60611", "900 N Lake Shore Dr", "(312) 555-0802", "Premium used inventory on the lakefront."),
  // Texas
  dealer("Houston Auto World", "Houston", "TX", "77002", "1200 Main Street", "(713) 555-0900", "Gulf Coast truck and SUV headquarters.", true),
  dealer("Space City Motors", "Houston", "TX", "77056", "5800 Westheimer Rd", "(713) 555-0901", "Galleria area mega dealer."),
  dealer("Dallas Motor Company", "Dallas", "TX", "75201", "1500 Elm Street", "(214) 555-0910", "North Texas pricing leader.", true),
  dealer("Lone Star Auto Dallas", "Dallas", "TX", "75204", "2800 North Henderson Ave", "(214) 555-0911", "Deep Ellum neighborhood dealer."),
  dealer("Fort Worth Truck Center", "Fort Worth", "TX", "76102", "400 Main Street", "(817) 555-0920", "Pickup and fleet specialists.", true),
  dealer("Stockyards Motors", "Fort Worth", "TX", "76164", "1200 N Main St", "(817) 555-0921", "Western heritage, modern inventory."),
  dealer("San Antonio Auto Sales", "San Antonio", "TX", "78205", "600 E Commerce St", "(210) 555-0930", "Alamo City family dealer.", true),
  dealer("Riverwalk Motor Group", "San Antonio", "TX", "78215", "800 East Cesar Chavez", "(210) 555-0931", "Used trucks and crossovers."),
  dealer("Austin Capital Motors", "Austin", "TX", "78701", "500 Congress Ave", "(512) 555-0940", "Fast-growing Austin market leader.", true),
  dealer("Hill Country Auto", "Austin", "TX", "78745", "4500 S Lamar Blvd", "(512) 555-0941", "Tech commuter friendly hybrids."),
  // Arizona
  dealer("Phoenix Desert Auto", "Phoenix", "AZ", "85004", "400 E Washington St", "(602) 555-1000", "Desert-tested SUVs and trucks.", true),
  dealer("Valley of the Sun Motors", "Phoenix", "AZ", "85016", "5200 N Central Ave", "(602) 555-1001", "Heat-ready inventory and service."),
  // Florida
  dealer("Miami Beach Auto", "Miami", "FL", "33139", "1200 Lincoln Road", "(305) 555-1100", "South Florida luxury and import specialist.", true),
  dealer("Magic City Motors", "Miami", "FL", "33130", "1800 SW 8th Street", "(305) 555-1101", "Bilingual staff, bilingual inventory."),
  dealer("Jacksonville Auto Center", "Jacksonville", "FL", "32202", "500 Water Street", "(904) 555-1110", "North Florida largest selection.", true),
  dealer("First Coast Motors", "Jacksonville", "FL", "32216", "7800 Philips Hwy", "(904) 555-1111", "Family SUVs and pickup trucks."),
  // Georgia
  dealer("Atlanta Peachtree Auto", "Atlanta", "GA", "30303", "100 Peachtree Street", "(404) 555-1200", "Southeast mega-dealer group flagship.", true),
  dealer("Metro Atlanta Motors", "Atlanta", "GA", "30308", "1200 Piedmont Ave", "(404) 555-1201", "Suburban commuter crossovers."),
  // Ohio
  dealer("Columbus Auto Exchange", "Columbus", "OH", "43215", "300 S High Street", "(614) 555-1300", "Central Ohio domestic brand hub.", true),
  dealer("Buckeye Motor Group", "Columbus", "OH", "43201", "1800 N High Street", "(614) 555-1301", "OSU area value inventory."),
  // North Carolina
  dealer("Charlotte Queen City Auto", "Charlotte", "NC", "28202", "500 South Tryon St", "(704) 555-1400", "Banking hub suburban growth market.", true),
  dealer("Carolina Motor Works", "Charlotte", "NC", "28204", "1400 Central Avenue", "(704) 555-1401", "AWD crossovers for Carolina commutes."),
  // Indiana
  dealer("Indianapolis Motor Speedway Auto", "Indianapolis", "IN", "46204", "400 W Washington St", "(317) 555-1500", "Crossroads of America dealer.", true),
  dealer("Circle City Motors", "Indianapolis", "IN", "46202", "900 Massachusetts Ave", "(317) 555-1501", "Domestic brand loyalty specialists."),
  // Washington
  dealer("Seattle Pacific Auto", "Seattle", "WA", "98101", "600 Pine Street", "(206) 555-1600", "PNW hybrid and AWD leader.", true),
  dealer("Emerald City Motors", "Seattle", "WA", "98109", "2200 Westlake Ave", "(206) 555-1601", "Rain-ready inventory and service."),
  // Colorado
  dealer("Denver Mile High Motors", "Denver", "CO", "80202", "1500 Broadway", "(303) 555-1700", "Mountain market SUV headquarters.", true),
  dealer("Rocky Mountain Auto", "Denver", "CO", "80203", "900 S Broadway", "(303) 555-1701", "Altitude-ready AWD specialists."),
  // Tennessee
  dealer("Nashville Music City Auto", "Nashville", "TN", "37203", "500 Broadway", "(615) 555-1800", "Booming Nashville newcomer favorite.", true),
  dealer("Volunteer State Motors", "Nashville", "TN", "37211", "4500 Nolensville Pike", "(615) 555-1801", "Trucks and family SUVs in Music City."),
];

async function main() {
  console.log("Seeding database...");

  await prisma.reviewHelpful.deleteMany();
  await prisma.review.deleteMany();
  await prisma.dealer.deleteMany();
  await prisma.ratingSourceSettings.deleteMany();

  const settings = await prisma.ratingSourceSettings.create({
    data: {
      googleEnabled: true,
      yelpEnabled: true,
      carfaxEnabled: true,
      autoSalesReviewsEnabled: true,
      platformEnabled: true,
    },
  });

  const usedSlugs = new Set<string>();

  for (const dealerData of dealers) {
    let slug = generateSlug(dealerData.name);
    if (usedSlugs.has(slug)) {
      slug = `${slug}-${dealerData.city.toLowerCase().replace(/\s+/g, "-")}`;
    }
    usedSlugs.add(slug);

    const reviewCount = randomBetween(hash(slug), 4, 8);
    const reviews = buildApprovedReviews(slug, reviewCount);
    const platformReviewCount = reviews.length;
    const platformRating =
      Math.round(
        (reviews.reduce((s, r) => s + r.overallRating, 0) / platformReviewCount) *
          10
      ) / 10;

    const external = buildExternalRatings(slug);
    const ratingFields = {
      ...external,
      platformRating,
      platformReviewCount,
      useManualRating: false,
      manualRatingOverride: null as number | null,
      hasBadge: dealerData.hasBadge ?? false,
      badgeYear: dealerData.badgeYear ?? null,
    };

    const { combinedRating } = calculateCombinedRating(
      {
        ...ratingFields,
        googleReviewCount: external.googleReviewCount,
        yelpReviewCount: external.yelpReviewCount,
      },
      settings
    );

    const { hasBadge, badgeYear, featured, ...rest } = dealerData;

    const created = await prisma.dealer.create({
      data: {
        ...rest,
        slug,
        featured: featured ?? false,
        ...ratingFields,
        combinedRating,
        reviews: {
          create: reviews,
        },
      },
    });

    console.log(`  ${created.city}, ${created.state}: ${created.name} (${combinedRating})`);
  }

  // A few pending reviews for admin panel testing
  const bergen = await prisma.dealer.findUnique({ where: { slug: "bergen-car" } });
  if (bergen) {
    await prisma.review.create({
      data: {
        dealerId: bergen.id,
        authorName: "Pending Tester",
        email: "pending.tester@example.com",
        overallRating: 5,
        customerServiceRating: 5,
        qualityRating: 5,
        friendlinessRating: 5,
        pricingRating: 4,
        recommend: true,
        title: "Waiting for approval",
        comment:
          "This is a pending review used to exercise the admin moderation queue during development and QA.",
        visitType: "Just Looking",
        status: REVIEW_STATUS.pending,
      },
    });
  }

  const byState = await prisma.dealer.groupBy({
    by: ["state"],
    _count: { id: true },
  });

  console.log(`\nSeeding complete: ${dealers.length} dealers`);
  for (const row of byState.sort((a, b) => a.state.localeCompare(b.state))) {
    console.log(`  ${row.state}: ${row._count.id}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
