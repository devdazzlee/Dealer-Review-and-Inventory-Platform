import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocationLandingView } from "@/components/dealers/LocationLandingView";
import { ROUTES } from "@/config/constants";
import {
  buildStateFaq,
  buildStateMetaDescription,
  buildStateMetaTitle,
  buildStateSeoContent,
  getCitiesByState,
  getTargetStateCodes,
  getAllTargetStateSlugs,
} from "@/config/locations";
import { createPageMetadata, buildStatePageMetadata } from "@/config/seo";
import { parseStateSlug, getStateLabel } from "@/lib/dealers/state-slugs";
import { buildStatePageSchemas } from "@/lib/schema/builders";

interface DealerStatePageProps {
  params: { state: string };
}

export function generateStaticParams() {
  return getAllTargetStateSlugs().map((state) => ({ state }));
}

export function generateMetadata({
  params,
}: DealerStatePageProps): Metadata {
  const stateCode = parseStateSlug(params.state);
  if (!stateCode || !getTargetStateCodes().includes(stateCode)) {
    return createPageMetadata(
      "Dealers by State | AutoSalesReviews",
      "Browse trusted car dealerships by state on AutoSalesReviews.",
      ROUTES.dealers
    );
  }

  return buildStatePageMetadata(
    buildStateMetaTitle(stateCode),
    buildStateMetaDescription(stateCode),
    ROUTES.dealerState(stateCode),
    getStateLabel(stateCode)
  );
}

export default function DealerStatePage({ params }: DealerStatePageProps) {
  const stateCode = parseStateSlug(params.state);
  if (!stateCode || !getTargetStateCodes().includes(stateCode)) {
    notFound();
  }

  const stateName = getStateLabel(stateCode);
  const faqItems = buildStateFaq(stateCode);
  const schemas = buildStatePageSchemas(stateCode, faqItems);
  const cities = getCitiesByState(stateCode);

  return (
    <LocationLandingView
      h1={`Car Dealerships in ${stateName}`}
      subtitle={`Browse trusted car dealers across ${stateName} with combined Google ratings and each dealer's Yelp score.`}
      badge={stateCode}
      breadcrumbs={[
        { label: "Home", href: ROUTES.home },
        { label: "Dealers", href: ROUTES.dealers },
        { label: stateName },
      ]}
      searchParams={{ state: stateCode }}
      seoContent={buildStateSeoContent(stateCode)}
      faqItems={faqItems}
      schemas={schemas}
      stateCities={{ stateCode, cities }}
      emptyTitle={`No dealers found in ${stateName}`}
      emptyDescription={`Try adjusting your filters or browse dealers in a specific city below.`}
    />
  );
}
