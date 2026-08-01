import Link from "next/link";
import { Gauge, MapPin } from "lucide-react";
import type { Vehicle } from "@/types/vehicle";
import { ROUTES } from "@/config/constants";
import { formatMileage, formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { VehiclePhoto } from "@/components/vehicles/VehiclePhoto";
import { ConditionBadge } from "@/components/vehicles/ConditionBadge";
import { DealerRatingInline } from "@/components/vehicles/DealerRatingInline";
import { CompareCheckbox } from "@/components/vehicles/CompareCheckbox";
import { toCompareVehicleSummary } from "@/lib/vehicles/compare";

interface VehicleCardProps {
  vehicle: Vehicle;
  priority?: boolean;
  sizes?: string;
  quality?: number;
}

// Matches the actual rendered card width inside container-page's 1-/2-/3-column
// grid (max-w-1240px, gap-6, responsive px-4/6/8 padding), so the browser
// picks the smallest sufficient srcset candidate instead of over-fetching.
const DEFAULT_SIZES =
  "(max-width: 639px) calc(100vw - 32px), (max-width: 1023px) calc(50vw - 36px), (max-width: 1303px) calc(33vw - 37px), 376px";

export function VehicleCard({
  vehicle,
  priority = false,
  sizes = DEFAULT_SIZES,
  quality = 70,
}: VehicleCardProps) {
  const href = ROUTES.vehicleDetail(vehicle.id);
  const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;

  return (
    <article
      className={cn(
        "group flex flex-col overflow-hidden rounded-lg border bg-card shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover",
        vehicle.dealer.featured
          ? "border-accent/50 ring-1 ring-accent/30"
          : "border-border/70"
      )}
    >
      <Link
        href={href}
        prefetch={false}
        className="relative block"
        aria-label={`View ${vehicleLabel}`}
      >
        <VehiclePhoto
          vehicle={vehicle}
          className="w-full"
          sizes={sizes}
          priority={priority}
          quality={quality}
        />
        <div className="absolute left-3 top-3 flex items-center gap-2" aria-hidden>
          <ConditionBadge condition={vehicle.condition} />
          {vehicle.dealer.featured && (
            <span className="inline-flex items-center rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent-foreground">
              Featured
            </span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={href} prefetch={false}>
          <h3 className="text-base font-bold text-primary transition-colors group-hover:text-navy-600">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
        </Link>
        <p className="mt-0.5 text-sm text-muted-foreground line-clamp-1">
          {vehicle.trim}
        </p>

        <p className="mt-2 text-2xl font-extrabold text-price">
          {formatPrice(vehicle.price)}
        </p>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs font-medium text-primary">
            <Gauge className="h-3.5 w-3.5" />
            {formatMileage(vehicle.mileage)}
          </span>
          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-primary">
            {vehicle.bodyStyle}
          </span>
          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-1 text-xs font-medium text-primary">
            {vehicle.fuelType}
          </span>
        </div>

        <div className="mt-4 border-t border-border/70 pt-3">
          <div className="flex items-center justify-between gap-2">
            <Link
              href={ROUTES.dealerProfile(vehicle.dealer.slug)}
              prefetch={false}
              className="truncate text-sm font-semibold text-foreground hover:text-primary hover:underline"
            >
              {vehicle.dealer.name}
            </Link>
            <DealerRatingInline rating={vehicle.dealer.ratings.combined} />
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {vehicle.dealer.city}, {vehicle.dealer.state}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <CompareCheckbox vehicle={toCompareVehicleSummary(vehicle)} />
          <Button asChild className="flex-1">
            <Link href={href} prefetch={false} aria-label={`View details for ${vehicleLabel}`}>
              View Details
            </Link>
          </Button>
        </div>
      </div>
    </article>
  );
}
