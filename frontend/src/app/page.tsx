import type { Metadata } from "next";
import { cookies } from "next/headers";
import { HomeHero } from "@/components/home/HomeHero";
import { HomeStatsBand } from "@/components/home/HomeStatsBand";
import { FeaturedVehicles } from "@/components/home/FeaturedVehicles";
import { BrowseByCategory } from "@/components/home/BrowseByCategory";
import { BrowseByRegion } from "@/components/home/BrowseByRegion";
import { BrowseByBrand } from "@/components/home/BrowseByBrand";
import { PopularCities } from "@/components/home/PopularCities";
import { TopRatedDealers } from "@/components/home/TopRatedDealers";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { SeoContentStatic } from "@/components/seo/SeoContentStatic";
import { LocationFaqSection } from "@/components/dealers/LocationFaqSection";
import { PAGE_SEO } from "@/config/seo";
import { HOME_FAQ_ITEMS, HOME_SEO_CONTENT } from "@/config/seo-content";
import {
  buildFaqPageSchema,
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "@/lib/schema/builders";
import {
  LOCATION_COOKIE_NAME,
  parseUserLocationCookie,
} from "@/lib/location/location-cookie";

export const metadata: Metadata = PAGE_SEO.home;

export default function HomePage() {
  // Reading the visitor's location cookie personalizes the sections below,
  // which opts this route into per-request (dynamic) rendering. This may be
  // an explicit choice from the location prompt, or an automatic IP-based
  // guess middleware already wrote on an earlier request — either way, by
  // the time this page runs the cookie is the single source of truth.
  const location = parseUserLocationCookie(
    cookies().get(LOCATION_COOKIE_NAME)?.value
  );

  const faqSchema = buildFaqPageSchema(HOME_FAQ_ITEMS);

  return (
    <>
      <SchemaMarkup
        data={[
          buildOrganizationSchema(),
          buildWebSiteSchema(),
          ...(faqSchema ? [faqSchema] : []),
        ]}
      />
      <HomeHero />
      <HomeStatsBand />
      <FeaturedVehicles location={location ?? undefined} />
      <BrowseByCategory />
      <BrowseByRegion />
      <BrowseByBrand />
      <PopularCities />
      <TopRatedDealers location={location ?? undefined} />
      <LocationFaqSection items={HOME_FAQ_ITEMS} />
      <SeoContentStatic content={HOME_SEO_CONTENT} variant="muted" />
    </>
  );
}
