import Link from "next/link";
import type { Vehicle } from "@/types/vehicle";
import { ROUTES } from "@/config/constants";
import { formatMileage, formatPrice } from "@/lib/utils/format";
import { VehiclePhoto } from "@/components/vehicles/VehiclePhoto";

export function SimilarVehicles({ vehicles }: { vehicles: Vehicle[] }) {
  if (vehicles.length === 0) return null;

  return (
    <div className="space-y-3">
      {vehicles.map((vehicle) => (
        <Link
          key={vehicle.id}
          href={ROUTES.vehicleDetail(vehicle.dealer.slug, vehicle.slug)}
          className="group flex gap-3 rounded-lg border border-border/70 bg-white p-2.5 shadow-card transition-all hover:shadow-card-hover"
        >
          <VehiclePhoto
            vehicle={vehicle}
            className="w-24 shrink-0 rounded-md"
            width={96}
            height={64}
            sizes="96px"
            showCount={false}
            iconClassName="h-6 w-6"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-primary group-hover:text-navy-600">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </p>
            <p className="text-sm font-extrabold text-price">
              {formatPrice(vehicle.price)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatMileage(vehicle.mileage)} · {vehicle.bodyStyle}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
