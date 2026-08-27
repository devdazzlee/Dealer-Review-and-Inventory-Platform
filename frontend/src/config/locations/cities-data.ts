import { toCityStateSlug } from "@/lib/dealers/location-slugs";

export interface TargetCity {
  city: string;
  stateCode: string;
  slug: string;
  marketDescriptor: string;
  nearbySlugs: string[];
  /** City-center coordinates, used for nearest-city geolocation matching. */
  lat: number;
  lng: number;
}

function city(
  name: string,
  stateCode: string,
  marketDescriptor: string,
  nearbySlugs: string[],
  lat: number,
  lng: number
): TargetCity {
  return {
    city: name,
    stateCode,
    slug: toCityStateSlug(name, stateCode),
    marketDescriptor,
    nearbySlugs,
    lat,
    lng,
  };
}

/** Curated high-intent city landing pages for local SEO. */
export const TARGET_CITIES: TargetCity[] = [
  city("New York", "NY", "the nation's largest metro car market with borough-wide dealer options", [
    "brooklyn-ny", "queens-ny", "bronx-ny", "newark-nj", "jersey-city-nj",
  ], 40.7128, -74.0060),
  city("Brooklyn", "NY", "a dense urban market where buyers weigh street parking and transit access", [
    "new-york-ny", "queens-ny", "jersey-city-nj", "newark-nj",
  ], 40.6782, -73.9442),
  city("Queens", "NY", "a diverse borough with strong used-car demand near major airports", [
    "new-york-ny", "brooklyn-ny", "bronx-ny", "newark-nj",
  ], 40.7282, -73.7949),
  city("Bronx", "NY", "a growing market for value-focused buyers north of Manhattan", [
    "new-york-ny", "queens-ny", "brooklyn-ny", "newark-nj",
  ], 40.8448, -73.8648),
  city("Los Angeles", "CA", "Southern California's flagship market with year-round buying season", [
    "san-diego-ca", "san-jose-ca", "san-francisco-ca",
  ], 34.0522, -118.2437),
  city("Chicago", "IL", "the Midwest hub where winter weather shapes SUV and AWD demand", [
    "indianapolis-in", "columbus-oh",
  ], 41.8781, -87.6298),
  city("Houston", "TX", "a truck-heavy market with sprawling suburban dealer corridors", [
    "dallas-tx", "san-antonio-tx", "austin-tx", "fort-worth-tx",
  ], 29.7604, -95.3698),
  city("Phoenix", "AZ", "a fast-growing desert metro where heat and dust affect vehicle choice", [
    "denver-co", "san-diego-ca",
  ], 33.4484, -112.0740),
  city("Philadelphia", "PA", "a tri-state market bridging Pennsylvania, New Jersey, and Delaware buyers", [
    "pittsburgh-pa", "allentown-pa", "newark-nj", "jersey-city-nj",
  ], 39.9526, -75.1652),
  city("San Antonio", "TX", "a family-oriented Texas market with strong used-truck inventory", [
    "austin-tx", "houston-tx", "dallas-tx",
  ], 29.4241, -98.4936),
  city("San Diego", "CA", "a coastal California market favoring fuel-efficient and compact SUVs", [
    "los-angeles-ca", "phoenix-az", "san-jose-ca",
  ], 32.7157, -117.1611),
  city("Dallas", "TX", "North Texas's largest dealer hub with competitive new and used pricing", [
    "fort-worth-tx", "houston-tx", "austin-tx", "san-antonio-tx",
  ], 32.7767, -96.7970),
  city("San Jose", "CA", "Silicon Valley's tech-driven market with high demand for EVs and hybrids", [
    "san-francisco-ca", "los-angeles-ca", "san-diego-ca",
  ], 37.3382, -121.8863),
  city("Austin", "TX", "a fast-growing capital city with transplants comparing dealers statewide", [
    "san-antonio-tx", "houston-tx", "dallas-tx", "fort-worth-tx",
  ], 30.2672, -97.7431),
  city("Jacksonville", "FL", "Florida's largest city by area with strong pickup and family SUV sales", [
    "miami-fl", "atlanta-ga",
  ], 30.3322, -81.6557),
  city("Fort Worth", "TX", "a Dallas–Fort Worth sibling market with independent dealer clusters", [
    "dallas-tx", "austin-tx", "houston-tx",
  ], 32.7555, -97.3308),
  city("Columbus", "OH", "Central Ohio's anchor market with Midwest pricing and steady inventory", [
    "indianapolis-in", "pittsburgh-pa", "chicago-il",
  ], 39.9612, -82.9988),
  city("Charlotte", "NC", "a banking-hub market with rapid suburban growth and commuting buyers", [
    "atlanta-ga", "columbus-oh", "nashville-tn",
  ], 35.2271, -80.8431),
  city("Indianapolis", "IN", "the Crossroads of America with strong domestic brand loyalty", [
    "chicago-il", "columbus-oh", "nashville-tn",
  ], 39.7684, -86.1581),
  city("San Francisco", "CA", "a compact urban market where parking and EV incentives shape purchases", [
    "san-jose-ca", "los-angeles-ca", "seattle-wa",
  ], 37.7749, -122.4194),
  city("Seattle", "WA", "the Pacific Northwest hub where AWD and hybrid demand stays high", [
    "denver-co", "san-francisco-ca",
  ], 47.6062, -122.3321),
  city("Denver", "CO", "a mountain-market metro where altitude and snow drive AWD and SUV sales", [
    "phoenix-az", "seattle-wa", "dallas-tx",
  ], 39.7392, -104.9903),
  city("Nashville", "TN", "Music City's booming market with newcomers comparing dealers statewide", [
    "atlanta-ga", "charlotte-nc", "indianapolis-in",
  ], 36.1627, -86.7816),
  city("Newark", "NJ", "North Jersey's gateway city with access to metro New York dealer inventory", [
    "jersey-city-nj", "paramus-nj", "hackensack-nj", "new-york-ny", "brooklyn-ny",
  ], 40.7357, -74.1724),
  city("Jersey City", "NJ", "a Hudson waterfront market serving commuters shopping across state lines", [
    "newark-nj", "new-york-ny", "paramus-nj", "hackensack-nj",
  ], 40.7178, -74.0431),
  city("Paramus", "NJ", "Bergen County's auto row with one of the highest dealer densities in the US", [
    "hackensack-nj", "newark-nj", "jersey-city-nj", "new-york-ny",
  ], 40.9445, -74.0754),
  city("Hackensack", "NJ", "a Bergen County hub adjacent to Paramus with strong local competition", [
    "paramus-nj", "newark-nj", "jersey-city-nj", "lodi-nj",
  ], 40.8859, -74.0435),
  city("Lodi", "NJ", "a Bergen County community with easy access to Route 80 and Route 46 dealer corridors", [
    "hackensack-nj", "paramus-nj", "jersey-city-nj", "new-york-ny",
  ], 40.8785, -74.0821),
  city("Hartford", "CT", "Connecticut's capital region with insurance-industry commuters", [
    "new-haven-ct", "bridgeport-ct", "boston-ma",
  ], 41.7658, -72.6734),
  city("New Haven", "CT", "a Yale-area market mixing urban buyers with shoreline shoppers", [
    "hartford-ct", "bridgeport-ct", "new-york-ny",
  ], 41.3083, -72.9279),
  city("Bridgeport", "CT", "Fairfield County's alternative to New York metro pricing", [
    "new-haven-ct", "hartford-ct", "new-york-ny",
  ], 41.1792, -73.1894),
  city("Pittsburgh", "PA", "Western Pennsylvania's market favoring AWD crossovers and trucks", [
    "philadelphia-pa", "allentown-pa", "columbus-oh",
  ], 40.4406, -79.9959),
  city("Allentown", "PA", "the Lehigh Valley between Philadelphia and New York metro areas", [
    "philadelphia-pa", "pittsburgh-pa", "newark-nj",
  ], 40.6023, -75.4714),
  city("Atlanta", "GA", "the Southeast's dominant sprawl market with mega-dealer groups", [
    "charlotte-nc", "nashville-tn", "miami-fl", "jacksonville-fl",
  ], 33.7490, -84.3880),
  city("Miami", "FL", "an international market with strong luxury and used-import demand", [
    "jacksonville-fl", "atlanta-ga",
  ], 25.7617, -80.1918),
  city("Boston", "MA", "New England's hub where salt-road winters define buyer priorities", [
    "hartford-ct", "new-york-ny", "newark-nj",
  ], 42.3601, -71.0589),
];

export const TARGET_CITY_BY_SLUG = new Map(
  TARGET_CITIES.map((entry) => [entry.slug, entry])
);

export interface TopCityServed {
  city: string;
  stateCode: string;
  slug: string;
  vehicleCount: number;
}

/**
 * Highest-inventory served cities nationwide, ranked by vehicle count.
 * Single source of truth for the homepage "Top Cities We Serve" panel
 * and the header's "Cities We Serve" dropdown, so both stay in sync.
 */
export const TOP_CITIES_SERVED: TopCityServed[] = [
  { city: "New York", stateCode: "NY", slug: "new-york-ny", vehicleCount: 412 },
  { city: "Los Angeles", stateCode: "CA", slug: "los-angeles-ca", vehicleCount: 388 },
  { city: "Chicago", stateCode: "IL", slug: "chicago-il", vehicleCount: 301 },
  { city: "Houston", stateCode: "TX", slug: "houston-tx", vehicleCount: 276 },
  { city: "Phoenix", stateCode: "AZ", slug: "phoenix-az", vehicleCount: 245 },
  { city: "Philadelphia", stateCode: "PA", slug: "philadelphia-pa", vehicleCount: 210 },
  { city: "San Antonio", stateCode: "TX", slug: "san-antonio-tx", vehicleCount: 198 },
  { city: "Austin", stateCode: "TX", slug: "austin-tx", vehicleCount: 184 },
  { city: "Dallas", stateCode: "TX", slug: "dallas-tx", vehicleCount: 176 },
  { city: "Jacksonville", stateCode: "FL", slug: "jacksonville-fl", vehicleCount: 142 },
];

export const HOMEPAGE_POPULAR_CITIES = [
  { city: "New York", stateCode: "NY", slug: "new-york-ny" },
  { city: "Los Angeles", stateCode: "CA", slug: "los-angeles-ca" },
  { city: "Chicago", stateCode: "IL", slug: "chicago-il" },
  { city: "Houston", stateCode: "TX", slug: "houston-tx" },
  { city: "Philadelphia", stateCode: "PA", slug: "philadelphia-pa" },
  { city: "Newark", stateCode: "NJ", slug: "newark-nj" },
  { city: "Atlanta", stateCode: "GA", slug: "atlanta-ga" },
  { city: "Miami", stateCode: "FL", slug: "miami-fl" },
] as const;

/** Quick-pick shortlist shown in the location prompt modal. */
export const LOCATION_PROMPT_CITIES = [
  { city: "New York", stateCode: "NY", slug: "new-york-ny" },
  { city: "Los Angeles", stateCode: "CA", slug: "los-angeles-ca" },
  { city: "Chicago", stateCode: "IL", slug: "chicago-il" },
  { city: "Houston", stateCode: "TX", slug: "houston-tx" },
  { city: "Austin", stateCode: "TX", slug: "austin-tx" },
  { city: "Phoenix", stateCode: "AZ", slug: "phoenix-az" },
] as const;
