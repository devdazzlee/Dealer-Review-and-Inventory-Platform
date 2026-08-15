import {
  Gauge,
  Car,
  Fuel,
  Cog,
  Palette,
  BadgeCheck,
  type LucideIcon,
} from "lucide-react";
import type { Vehicle } from "@/types/vehicle";
import { formatMileage } from "@/lib/utils/format";

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-white p-3.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <p className="truncate text-sm font-bold text-primary">{value}</p>
      </div>
    </div>
  );
}

const CONDITION_LABEL = { NEW: "New", USED: "Used", CPO: "Certified Pre-Owned" };

export function VehicleSpecs({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <Spec icon={Gauge} label="Mileage" value={formatMileage(vehicle.mileage)} />
      <Spec icon={Car} label="Body Style" value={vehicle.bodyStyle} />
      <Spec icon={Fuel} label="Fuel Type" value={vehicle.fuelType} />
      <Spec icon={Cog} label="Transmission" value={vehicle.transmission} />
      <Spec icon={Palette} label="Exterior Color" value={vehicle.exteriorColor} />
      <Spec icon={Palette} label="Interior Color" value={vehicle.interiorColor} />
      <Spec
        icon={BadgeCheck}
        label="Condition"
        value={CONDITION_LABEL[vehicle.condition]}
      />
    </div>
  );
}
