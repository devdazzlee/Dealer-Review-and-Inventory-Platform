import type { MetadataRoute } from "next";
import { BLOG_POSTS } from "@/config/blog";
import { ROUTES } from "@/config/constants";
import { getAllCitySlugs, getTargetStateCodes } from "@/config/locations";
import { VEHICLE_CATEGORY_KEYS, vehicleCategoryHref } from "@/config/vehicle-categories";
import { getDealers } from "@/lib/api/dealers";
import { getSiteUrl } from "@/lib/seo";
import { getAllVehicles } from "@/lib/vehicles/data";
import type { DealerSummary } from "@/types/dealer";

/** Rebuild sitemap periodically so new dealers appear without failing CI when the API is down. */
export const revalidate = 3600;

type SitemapEntry = MetadataRoute.Sitemap[number];

function entry(
  path: string,
  priority: number,
  changeFrequency: SitemapEntry["changeFrequency"],
  lastModified = new Date()
): SitemapEntry {
  const base = getSiteUrl();
  const url =
    path === "/" ? `${base}/` : `${base}${normalizePath(path)}`;

  return { url, lastModified, changeFrequency, priority };
}

function normalizePath(path: string): string {
  return path.startsWith("/") ? path : `/${path}`;
}

const STATIC_PAGES: {
  path: string;
  priority: number;
  changeFrequency: SitemapEntry["changeFrequency"];
}[] = [
  { path: ROUTES.home, priority: 1.0, changeFrequency: "daily" },
  { path: ROUTES.vehicles, priority: 1.0, changeFrequency: "daily" },
  { path: ROUTES.dealers, priority: 1.0, changeFrequency: "daily" },
  { path: ROUTES.about, priority: 1.0, changeFrequency: "daily" },
  { path: ROUTES.blog, priority: 1.0, changeFrequency: "daily" },
  { path: ROUTES.contact, priority: 1.0, changeFrequency: "daily" },
  { path: ROUTES.forDealers, priority: 1.0, changeFrequency: "daily" },
  { path: ROUTES.writeReview, priority: 1.0, changeFrequency: "daily" },
  { path: ROUTES.cities, priority: 0.6, changeFrequency: "monthly" },
];

/**
 * Dealers come from the live API. During Vercel builds the API may be
 * unreachable or cold — never fail the whole sitemap/export for that.
 */
async function loadDealers(): Promise<DealerSummary[]> {
  try {
    return await getDealers();
  } catch (error) {
    console.error(
      "[sitemap] Failed to load dealers; publishing sitemap without dealer URLs.",
      error
    );
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const dealers = await loadDealers();
  const vehicles = getAllVehicles();
  const now = new Date();

  const staticEntries = STATIC_PAGES.map(({ path, priority, changeFrequency }) =>
    entry(path, priority, changeFrequency, now)
  );

  const dealerEntries = dealers.map((dealer) =>
    entry(ROUTES.dealerProfile(dealer.slug), 0.8, "weekly", now)
  );

  const vehicleEntries = vehicles.map((vehicle) =>
    entry(ROUTES.vehicleDetail(vehicle.id), 0.7, "daily", now)
  );

  const blogEntries = BLOG_POSTS.map((post) =>
    entry(ROUTES.blogPost(post.slug), 0.6, "weekly", now)
  );

  const stateEntries = getTargetStateCodes().map((stateCode) =>
    entry(ROUTES.dealerState(stateCode), 0.8, "weekly", now)
  );

  const cityEntries = getAllCitySlugs().map((citySlug) =>
    entry(ROUTES.dealerCity(citySlug), 0.7, "weekly", now)
  );

  const categoryEntries = VEHICLE_CATEGORY_KEYS.map((key) =>
    entry(vehicleCategoryHref(key), 0.9, "daily", now)
  );

  return [
    ...staticEntries,
    ...categoryEntries,
    ...dealerEntries,
    ...vehicleEntries,
    ...blogEntries,
    ...stateEntries,
    ...cityEntries,
  ];
}
