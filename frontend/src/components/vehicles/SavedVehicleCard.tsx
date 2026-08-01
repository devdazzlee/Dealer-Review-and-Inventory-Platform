"use client";

import Link from "next/link";
import { Gauge, Loader2, MapPin, Trash2 } from "lucide-react";
import type { Vehicle } from "@/types/vehicle";
import { ROUTES } from "@/config/constants";
import { formatMileage, formatPrice } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";
import { VehiclePhoto } from "@/components/vehicles/VehiclePhoto";
import { ConditionBadge } from "@/components/vehicles/ConditionBadge";
import { CompareCheckbox } from "@/components/vehicles/CompareCheckbox";
import { useSavedVehicles } from "@/contexts/saved-vehicles-context";
import { toCompareVehicleSummary } from "@/lib/vehicles/compare";
import { cn } from "@/lib/utils";

/**
 * Shortlist card for /saved — denser than inventory rows: photo-first grid,
 * price + essentials, Remove on the media, View as the primary CTA.
 */
export function SavedVehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const { toggleSave, isSaving } = useSavedVehicles();
  const href = ROUTES.vehicleDetail(vehicle.id);
  const label = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const removing = isSaving(vehicle.id);

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-white shadow-card",
        "transition-all duration-200",
        removing
          ? "pointer-events-none opacity-70"
          : "hover:-translate-y-0.5 hover:shadow-card-hover"
      )}
      aria-busy={removing}
    >
      {removing && (
        <div
          className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-2 bg-white/75 backdrop-blur-[2px]"
          role="status"
          aria-live="polite"
        >
          <Loader2 className="h-7 w-7 animate-spin text-primary" />
          <span className="text-sm font-semibold text-primary">Removing…</span>
        </div>
      )}

      <div className="relative">
        <Link href={href} className="relative block" aria-label={`View ${label}`}>
          <VehiclePhoto
            vehicle={vehicle}
            className="aspect-[16/10] w-full"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute left-3 top-3">
            <ConditionBadge condition={vehicle.condition} />
          </div>
        </Link>

        <button
          type="button"
          onClick={() => void toggleSave(vehicle.id)}
          disabled={removing}
          aria-busy={removing}
          aria-label={
            removing ? `Removing ${label}…` : `Remove ${label} from saved`
          }
          title={removing ? "Removing…" : "Remove from saved"}
          className={cn(
            "absolute right-3 top-3 z-10 inline-flex h-10 w-10 items-center justify-center rounded-full",
            "border border-white/70 bg-white/95 text-muted-foreground shadow-sm backdrop-blur-sm",
            "transition-colors hover:border-destructive/30 hover:bg-white hover:text-destructive",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40",
            "disabled:pointer-events-none"
          )}
        >
          {removing ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={href}>
              <h2 className="text-lg font-bold leading-snug text-primary transition-colors hover:text-navy-600">
                {label}
              </h2>
            </Link>
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              {vehicle.trim}
            </p>
          </div>
          <p className="shrink-0 text-xl font-extrabold tabular-nums text-price">
            {formatPrice(vehicle.price)}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-muted-foreground">
          <span className="inline-flex items-center gap-1 text-primary">
            <Gauge className="h-3.5 w-3.5" />
            {formatMileage(vehicle.mileage)}
          </span>
          <span aria-hidden className="text-border">
            ·
          </span>
          <span>{vehicle.bodyStyle}</span>
          <span aria-hidden className="text-border">
            ·
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" />
            {vehicle.dealer.city}, {vehicle.dealer.state}
          </span>
        </div>

        <p className="mt-2 truncate text-sm font-semibold text-foreground">
          {vehicle.dealer.name}
          <span className="ml-1.5 font-medium text-muted-foreground">
            · {vehicle.dealer.ratings.combined != null
              ? `${vehicle.dealer.ratings.combined.toFixed(1)}★`
              : "No rating"}
          </span>
        </p>

        <div className="mt-auto flex items-center gap-2 pt-4">
          <Button asChild className="min-w-0 flex-1" disabled={removing}>
            <Link href={href}>View Vehicle</Link>
          </Button>
          <CompareCheckbox
            vehicle={toCompareVehicleSummary(vehicle)}
            className="shrink-0 rounded-lg border border-border px-2.5 py-2"
          />
        </div>
      </div>
    </article>
  );
}
