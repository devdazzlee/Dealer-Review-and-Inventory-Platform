import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getFeaturedVehicles } from "@/lib/vehicles/data";
import { ROUTES } from "@/config/constants";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import type { UserLocation } from "@/lib/location/location-cookie";

export function FeaturedVehicles({ location }: { location?: UserLocation }) {
  const vehicles = getFeaturedVehicles(6, {
    city: location?.city,
    stateCode: location?.stateCode,
  });
  const isPersonalized =
    !!location &&
    vehicles.some((v) => v.dealer.city.toLowerCase() === location.city.toLowerCase());

  return (
    <section className="bg-background">
      <div className="container-page py-16">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              {isPersonalized
                ? `Vehicles Near ${location!.city}, ${location!.stateCode}`
                : "Browse Latest Vehicles"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              {isPersonalized
                ? `Fresh inventory from top-rated dealers near ${location!.city}.`
                : "Fresh inventory from top-rated dealers near you."}
            </p>
          </div>
          <Link
            href={ROUTES.vehicles}
            prefetch={false}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-primary hover:text-navy-600 hover:underline sm:mt-0"
          >
            View All Vehicles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
