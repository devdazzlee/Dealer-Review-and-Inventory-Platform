"use client";

import { useState } from "react";
import { Car } from "lucide-react";
import type { Vehicle } from "@/types/vehicle";
import { HOME_BODY_STYLES } from "@/config/vehicle";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

interface BrowseByCategoryClientProps {
  vehiclesByCategory: Record<string, Vehicle[]>;
}

export function BrowseByCategoryClient({
  vehiclesByCategory,
}: BrowseByCategoryClientProps) {
  const [active, setActive] = useState(HOME_BODY_STYLES[0].value);
  const activeLabel =
    HOME_BODY_STYLES.find((c) => c.value === active)?.label ?? active;
  const vehicles = vehiclesByCategory[active] ?? [];

  return (
    <section className="bg-white">
      <div className="container-page py-16">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
            Browse by Type
          </h2>
          <p className="mt-2 text-muted-foreground">
            Find the right body style for how you drive.
          </p>
        </div>

        <div
          className="mb-8 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Browse vehicles by category"
        >
          {HOME_BODY_STYLES.map((cat) => (
            <button
              key={cat.value}
              type="button"
              role="tab"
              aria-selected={active === cat.value}
              onClick={() => setActive(cat.value)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-semibold transition-colors",
                active === cat.value
                  ? "bg-primary text-white"
                  : "bg-secondary text-foreground hover:bg-secondary/70"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {vehicles.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No vehicles yet"
            description={`Check back soon for ${activeLabel.toLowerCase()} inventory.`}
          />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
