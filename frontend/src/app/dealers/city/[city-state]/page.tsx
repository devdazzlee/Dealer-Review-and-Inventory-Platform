import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LocationLandingView } from "@/components/dealers/LocationLandingView";
import { ROUTES, STATE_LABELS } from "@/config/constants";
import {
  buildCityFaq,
  buildCityMetaDescription,
  buildCityMetaTitle,
  buildCitySeoContent,
  getCityBySlug,
  getNearbyCities,
  getAllCitySlugs,
} from "@/config/locations";
import { createPageMetadata, buildCityPageMetadata } from "@/config/seo";
import { buildCityPageSchemas } from "@/lib/schema/builders";

interface DealerCityPageProps {
  params: { "city-state": string };
}

export function generateStaticParams() {
  return getAllCitySlugs().map((cityState) => ({
    "city-state": cityState,
  }));
}

export function generateMetadata({
  params,
}: DealerCityPageProps): Metadata {
  const target = getCityBySlug(params["city-state"]);
  if (!target) {
    return createPageMetadata(
      "Dealers by City | AutoSalesReviews",
      "Browse trusted car dealerships by city on AutoSalesReviews.",
      ROUTES.cities
    );
  }

  return buildCityPageMetadata(
    buildCityMetaTitle(target.city, target.stateCode),
    buildCityMetaDescription(target.city, target.stateCode),
    ROUTES.dealerCity(target.slug),
    target.city,
    target.stateCode
  );
}

export default function DealerCityPage({ params }: DealerCityPageProps) {
  const target = getCityBySlug(params["city-state"]);
  if (!target) notFound();

  const stateName = STATE_LABELS[target.stateCode] ?? target.stateCode;
  const faqItems = buildCityFaq(target);
  const schemas = buildCityPageSchemas(target, faqItems);
  const nearbyCities = getNearbyCities(target);

  return (
    <LocationLandingView
      h1={`Car Dealerships in ${target.city}, ${stateName}`}
      subtitle={`Compare trusted car dealers in ${target.city} with verified Google ratings and each dealer's Yelp score, then browse their inventory.`}
      badge={`${target.city}, ${target.stateCode}`}
      breadcrumbs={[
        { label: "Home", href: ROUTES.home },
        { label: "Dealers", href: ROUTES.dealers },
        { label: stateName, href: ROUTES.dealerState(target.stateCode) },
        { label: target.city },
      ]}
      searchParams={{ city: target.city, state: target.stateCode }}
      seoContent={buildCitySeoContent(target)}
      faqItems={faqItems}
      schemas={schemas}
      nearbyCities={nearbyCities}
      emptyTitle={`No dealers listed in ${target.city} yet`}
      emptyDescription={`We don't have dealerships in ${target.city}, ${stateName} right now. Browse nearby cities or search all dealers in ${stateName}.`}
    />
  );
}
