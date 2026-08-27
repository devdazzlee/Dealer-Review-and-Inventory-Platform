import type { Metadata } from "next";
import Link from "next/link";
import { ContentPage, ContentSection } from "@/components/layout/ContentPage";
import { ROUTES } from "@/config/constants";
import { getCitiesGroupedByState } from "@/config/locations";
import { createPageMetadata, PAGE_KEYWORDS } from "@/config/seo";
import { CITIES_FAQ_ITEMS, CITIES_SEO_CONTENT } from "@/config/seo-content";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { SeoContentSection } from "@/components/seo/SeoContentSection";
import { LocationFaqSection } from "@/components/dealers/LocationFaqSection";
import { buildCitiesDirectorySchemas } from "@/lib/schema/builders";
import { getDealerCountsByCity } from "@/lib/api/dealers";
import { hasRealDealers } from "@/lib/dealers/city-filter";

export const metadata: Metadata = createPageMetadata(
  "Find Car Dealerships by City | AutoSalesReviews",
  "Browse trusted car dealerships in cities across the United States. Find dealers, read reviews and search inventory in your city.",
  ROUTES.cities,
  { keywords: [...PAGE_KEYWORDS.cities] }
);

export default async function CitiesDirectoryPage() {
  const cityCounts = await getDealerCountsByCity();
  const groups = getCitiesGroupedByState()
    .map((group) => ({
      ...group,
      cities: group.cities.filter((city) => hasRealDealers(city, cityCounts)),
    }))
    // A state can lose all its cities once empty ones are filtered out —
    // don't render a heading with nothing under it.
    .filter((group) => group.cities.length > 0);

  return (
    <>
      <SchemaMarkup data={buildCitiesDirectorySchemas(CITIES_FAQ_ITEMS)} />
      <ContentPage
      title="Browse Car Dealers by City"
      subtitle="Find trusted dealerships in major cities across the United States."
      badge="City directory"
      centered
    >
      <ContentSection>
        <div className="space-y-10">
          {groups.map((group) => (
            <section key={group.stateCode}>
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-xl font-bold text-primary sm:text-2xl">
                  <Link
                    href={ROUTES.dealerState(group.stateCode)}
                    className="hover:underline"
                  >
                    {group.stateName}
                  </Link>
                </h2>
                <Link
                  href={ROUTES.dealerState(group.stateCode)}
                  className="text-sm font-semibold text-primary hover:underline"
                >
                  All dealers in {group.stateName} →
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.cities.map((city) => (
                  <Link
                    key={city.slug}
                    href={ROUTES.dealerCity(city.slug)}
                    className="rounded-lg border border-border/70 bg-white px-4 py-3 shadow-card transition-all hover:border-primary/30 hover:shadow-card-hover"
                  >
                    <span className="block font-bold text-primary">{city.city}</span>
                    <span className="text-xs text-muted-foreground">
                      {group.stateName}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </ContentSection>
    </ContentPage>

    <LocationFaqSection items={CITIES_FAQ_ITEMS} />
    <SeoContentSection content={CITIES_SEO_CONTENT} variant="muted" />
    </>
  );
}
