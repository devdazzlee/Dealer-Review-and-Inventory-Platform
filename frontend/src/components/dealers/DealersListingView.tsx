import { DealerSearchForm } from "@/components/dealers/DealerSearchForm";
import { DealerFilters } from "@/components/dealers/DealerFilters";
import { DealerResultsPendingShell } from "@/components/dealers/DealerResultsPendingShell";
import { DealersResultsSuspense } from "@/components/dealers/DealersResultsSuspense";
import { ActiveFilters } from "@/components/dealers/ActiveFilters";
import { SeoContentSection } from "@/components/seo/SeoContentSection";
import { LocationFaqSection } from "@/components/dealers/LocationFaqSection";
import { SITE } from "@/config/constants";
import {
  DEALERS_FAQ_ITEMS,
  getDealersListingSeoContent,
  type DealersListingSeoContext,
} from "@/config/seo-content";
import type { DealerQueryParams } from "@/types/dealer";

interface DealersListingViewProps {
  searchParams: DealerQueryParams;
  title?: string;
  subtitle?: string;
  badge?: string;
  seoContext?: DealersListingSeoContext;
}

export function DealersListingView({
  searchParams,
  title = "Top Rated Dealerships",
  subtitle = "Compare trusted car dealerships with combined Google ratings and each dealer's Yelp score, then browse their inventory.",
  badge = SITE.region,
  seoContext = { type: "default" },
}: DealersListingViewProps) {
  const { intro: introSeoContent, extended: extendedSeoContent } =
    getDealersListingSeoContent(seoContext);

  return (
    <div className="bg-background">
      <div className="bg-primary bg-hero-texture">
        <div className="container-page py-12 sm:py-14">
          <span className="mb-3 inline-block rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-accent">
            {badge}
          </span>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            {subtitle}
          </p>
        </div>
      </div>

      <SeoContentSection
        content={introSeoContent}
        variant="compact"
        className="border-b border-border/70 bg-white"
        collapsible={false}
      />

      <div className="container-page pb-10">
        <div className="mb-6 space-y-4 rounded-lg border border-border/70 bg-white p-4 shadow-card sm:p-5">
          <DealerSearchForm
            defaultValues={searchParams}
            currentParams={searchParams}
          />
          <div className="border-t border-border/70 pt-4">
            <DealerFilters params={searchParams} />
          </div>
        </div>

        <div className="mb-5">
          <ActiveFilters params={searchParams} />
        </div>

        <DealerResultsPendingShell>
          <DealersResultsSuspense searchParams={searchParams} />
        </DealerResultsPendingShell>
      </div>

      {seoContext.type === "default" && (
        <LocationFaqSection items={DEALERS_FAQ_ITEMS} />
      )}

      <SeoContentSection content={extendedSeoContent} variant="muted" />
    </div>
  );
}
