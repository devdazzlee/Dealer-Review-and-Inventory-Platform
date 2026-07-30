import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import {
  getVehicleById,
  getSimilarVehicles,
  getAllVehicles,
} from "@/lib/vehicles/data";
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
  buildProductSchema,
} from "@/lib/schema/builders";
import { buildVehicleDetailSeoContent } from "@/config/seo-content";
import { getVehicleDetailFaqs } from "@/config/vehicles/vehicle-detail-faq";

const VehicleContactActions = dynamic(
  () =>
    import("@/components/vehicles/VehicleContactActions").then((m) => ({
      default: m.VehicleContactActions,
    })),
  {
    loading: () => (
      <div className="h-[6.5rem] animate-pulse rounded-lg bg-muted sm:h-[6.25rem]" aria-hidden />
    ),
  }
);

interface VehicleDetailPageProps {
  params: { id: string };
}

export function generateStaticParams() {
  return getAllVehicles().map((v) => ({ id: v.id }));
}

export function generateMetadata({
  params,
}: VehicleDetailPageProps): Metadata {
  const vehicle = getVehicleById(params.id);
  if (!vehicle) return buildNotFoundMetadata("Vehicle");
  return buildVehicleMetadata(vehicle);
}

export default function VehicleDetailPage({ params }: VehicleDetailPageProps) {
  const vehicle = getVehicleById(params.id);
  if (!vehicle) notFound();

  const similar = getSimilarVehicles(vehicle, 3);
  const faqs = getVehicleDetailFaqs(vehicle);
  const faqSchema = buildFaqPageSchema(faqs);

  return (
    <>
      <SchemaMarkup
        data={[
          buildProductSchema(vehicle),
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
