import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  getVehicleBySlugFromApi,
  getVehicleSitemapEntries,
} from "@/lib/api/vehicles";
import { ROUTES } from "@/config/constants";
import {
  buildNotFoundMetadata,
  buildVehicleMetadata,
} from "@/config/seo";
import { formatPrice } from "@/lib/utils/format";
import {
  estimateMonthlyPayment,
  formatMonthlyEstimate,
} from "@/lib/finance/monthly-payment";
import { VehicleGallery } from "@/components/vehicles/VehicleGallery";
import { VehicleSpecs } from "@/components/vehicles/VehicleSpecs";
import { VehicleFeatures } from "@/components/vehicles/VehicleFeatures";
import { VehicleDealerCard } from "@/components/vehicles/VehicleDealerCard";
import { SimilarVehicles } from "@/components/vehicles/SimilarVehicles";
import { ConditionBadge } from "@/components/vehicles/ConditionBadge";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { SeoContentSection } from "@/components/seo/SeoContentSection";
import { VehicleFaqSection } from "@/components/vehicles/VehicleFaqSection";
import {
  buildFaqPageSchema,
  buildCarSchema,
  buildBreadcrumbSchema,
} from "@/lib/schema/builders";
import { buildVehicleDetailSeoContent } from "@/config/seo-content";
import { getVehicleDetailFaqs } from "@/config/vehicles/vehicle-detail-faq";
import { VehicleContactActionsLazy as VehicleContactActions } from "@/components/vehicles/VehicleContactActionsLazy";

/** Flat documentation fee shown only on Bergen Car vehicle detail pricing. */
const BERGEN_DOC_FEE = 890;

interface VehicleDetailPageProps {
  params: { "dealer-slug": string; "vehicle-slug": string };
}

export const revalidate = 60;

export async function generateStaticParams() {
  const entries = await getVehicleSitemapEntries();
  return entries.map((entry) => ({
    "dealer-slug": entry.dealerSlug,
    "vehicle-slug": entry.slug,
  }));
}

export async function generateMetadata({
  params,
}: VehicleDetailPageProps): Promise<Metadata> {
  try {
    const { vehicle } = await getVehicleBySlugFromApi(
      params["dealer-slug"],
      params["vehicle-slug"]
    );
    return buildVehicleMetadata(vehicle);
  } catch {
    return buildNotFoundMetadata("Vehicle");
  }
}

export default async function VehicleDetailPage({
  params,
}: VehicleDetailPageProps) {
  let payload;
  try {
    payload = await getVehicleBySlugFromApi(
      params["dealer-slug"],
      params["vehicle-slug"]
    );
  } catch {
    notFound();
  }

  const vehicle = payload.vehicle;
  const similar = payload.similar;
  const faqs = getVehicleDetailFaqs(vehicle);
  const faqSchema = buildFaqPageSchema(faqs);
  const detailPath = ROUTES.vehicleDetail(vehicle.dealer.slug, vehicle.slug);

  return (
    <>
      <SchemaMarkup
        data={[
          buildCarSchema(vehicle),
          buildBreadcrumbSchema([
            { name: "Home", path: ROUTES.home },
            { name: "Find Cars", path: ROUTES.vehicles },
            {
              name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
              path: detailPath,
            },
          ]),
          ...(faqSchema ? [faqSchema] : []),
        ]}
      />
      <div className="bg-background pb-24 lg:pb-0">
      {/* Breadcrumb */}
      <div className="border-b border-border/70 bg-white">
        <div className="container-page py-3">
          <nav
            className="flex items-center gap-1.5 text-sm text-muted-foreground"
            aria-label="Breadcrumb"
          >
            <Link href={ROUTES.home} className="hover:text-primary">
              Home
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link href={ROUTES.vehicles} className="hover:text-primary">
              Find Cars
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="truncate font-medium text-primary">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </span>
          </nav>
        </div>
      </div>

      <div className="container-page py-6 lg:py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
          {/* Main column */}
          <div className="space-y-8">
            <div className="space-y-4">
              <VehicleGallery vehicle={vehicle} />
              <VehicleContactActions vehicle={vehicle} />
            </div>

            <div>
              <h1 className="text-2xl font-extrabold text-primary sm:text-3xl">
                {vehicle.year} {vehicle.make} {vehicle.model}
              </h1>
              <p className="mt-1 text-base text-muted-foreground">
                {vehicle.trim}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-3xl font-extrabold text-price sm:text-4xl">
                  {formatPrice(vehicle.price)}
                </span>
                <span className="text-base font-semibold text-accent-text">
                  {formatMonthlyEstimate(estimateMonthlyPayment(vehicle.price))}
                </span>
                <ConditionBadge condition={vehicle.condition} className="text-sm" />
              </div>

              {vehicle.dealer.slug === "bergen-car" && (
                <div className="mt-4 rounded-lg border border-border/70 bg-white p-5 shadow-card">
                  <h2 className="mb-4 text-lg font-bold text-foreground">
                    Detailed Pricing
                  </h2>
                  <dl className="space-y-2.5 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted-foreground">Unit Price</dt>
                      <dd className="font-semibold text-foreground">
                        {formatPrice(vehicle.price)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-muted-foreground">Doc Fee</dt>
                      <dd className="font-semibold text-foreground">
                        {formatPrice(BERGEN_DOC_FEE)}
                      </dd>
                    </div>
                    <div className="border-t border-border/70 pt-2.5">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="font-bold text-foreground">
                          Out-the-Door Price
                        </dt>
                        <dd className="text-lg font-extrabold text-price">
                          {formatPrice(vehicle.price + BERGEN_DOC_FEE)}
                        </dd>
                      </div>
                    </div>
                  </dl>
                </div>
              )}
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-foreground">
                Key Specifications
              </h2>
              <VehicleSpecs vehicle={vehicle} />
              <p className="mt-3 text-xs text-muted-foreground">
                VIN: <span className="font-mono">{vehicle.vin}</span> ·{" "}
                {vehicle.drivetrain} · {vehicle.mpg}
              </p>
            </div>

            <div>
              <h2 className="mb-3 text-lg font-bold text-foreground">
                Vehicle Description
              </h2>
              <p className="leading-relaxed text-foreground/90">
                {vehicle.description}
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-white p-5 shadow-card">
              <h2 className="mb-4 text-lg font-bold text-foreground">
                Features &amp; Options
              </h2>
              <VehicleFeatures features={vehicle.features} />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
            <VehicleDealerCard dealer={vehicle.dealer} />

            {similar.length > 0 && (
              <div>
                <h2 className="mb-3 text-lg font-bold text-foreground">
                  Similar Vehicles
                </h2>
                <SimilarVehicles vehicles={similar} />
              </div>
            )}
          </aside>
        </div>
      </div>

      <VehicleFaqSection items={faqs} />

      <SeoContentSection
        content={buildVehicleDetailSeoContent({
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          bodyStyle: vehicle.bodyStyle,
          condition: vehicle.condition,
          dealer: vehicle.dealer,
        })}
        variant="muted"
      />
    </div>
    </>
  );
}
