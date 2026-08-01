import type { ReactNode } from "react";
import Link from "next/link";
import {
  BadgeCheck,
  Car,
  Compass,
  Crown,
  Fuel,
  Gauge,
  Leaf,
  MapPin,
  Palette,
  Settings2,
  Star,
  Store,
  Tag,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Vehicle } from "@/types/vehicle";
import { ROUTES } from "@/config/constants";
import { formatMileage, formatPrice } from "@/lib/utils/format";
import { buildCompareUrl } from "@/lib/vehicles/compare";
import { cn } from "@/lib/utils";
import { VehicleCompareImage } from "@/components/vehicles/VehicleCompareImage";
import { ConditionBadge } from "@/components/vehicles/ConditionBadge";

interface SpecRow {
  label: string;
  icon: LucideIcon;
  render: (vehicle: Vehicle) => ReactNode;
  /** When set, the cell(s) with the best value across the row get a "Best" highlight. */
  metric?: (vehicle: Vehicle) => number;
  betterWhen?: "lower" | "higher";
}

const SPEC_ROWS: SpecRow[] = [
  {
    label: "Price",
    icon: Tag,
    metric: (v) => v.price,
    betterWhen: "lower",
    render: (v) => (
      <span className="text-base font-extrabold text-price">
        {formatPrice(v.price)}
      </span>
    ),
  },
  {
    label: "Condition",
    icon: BadgeCheck,
    render: (v) => <ConditionBadge condition={v.condition} />,
  },
  {
    label: "Mileage",
    icon: Gauge,
    metric: (v) => v.mileage,
    betterWhen: "lower",
    render: (v) => formatMileage(v.mileage),
  },
  { label: "Body Style", icon: Car, render: (v) => v.bodyStyle },
  { label: "Fuel Type", icon: Fuel, render: (v) => v.fuelType },
  { label: "MPG", icon: Leaf, render: (v) => v.mpg },
  { label: "Transmission", icon: Settings2, render: (v) => v.transmission },
  { label: "Drivetrain", icon: Compass, render: (v) => v.drivetrain },
  { label: "Exterior Color", icon: Palette, render: (v) => v.exteriorColor },
  {
    label: "Dealer",
    icon: Store,
    render: (v) => (
      <Link
        href={ROUTES.dealerProfile(v.dealer.slug)}
        className="font-semibold text-primary hover:underline"
      >
        {v.dealer.name}
      </Link>
    ),
  },
  {
    label: "Dealer Location",
    icon: MapPin,
    render: (v) => `${v.dealer.city}, ${v.dealer.state}`,
  },
  {
    label: "Dealer Rating",
    icon: Star,
    metric: (v) => v.dealer.ratings.combined ?? 0,
    betterWhen: "higher",
    render: (v) => (
      <span className="inline-flex items-center gap-1">
        {v.dealer.ratings.combined != null && v.dealer.ratings.combined > 0
          ? v.dealer.ratings.combined.toFixed(1)
          : "New"}
        <Star className="h-3.5 w-3.5 fill-gold-600 text-gold-600" />
      </span>
    ),
  },
];

/** Only rows with a `metric` feed the "Best" tags and the overall Best Match verdict. */
const SCORED_ROWS = SPEC_ROWS.filter((row) => row.metric);

function bestValueForRow(row: SpecRow, vehicles: Vehicle[]): number | null {
  if (!row.metric) return null;
  const values = vehicles.map(row.metric);
  // A "best" only means something when the vehicles actually differ.
  if (new Set(values).size < 2) return null;
  return row.betterWhen === "higher" ? Math.max(...values) : Math.min(...values);
}

/** Tallies how many scored specs each vehicle wins outright. */
function scoreVehicles(vehicles: Vehicle[]): Map<string, string[]> {
  const wins = new Map<string, string[]>(vehicles.map((v) => [v.id, []]));
  for (const row of SCORED_ROWS) {
    const best = bestValueForRow(row, vehicles);
    if (best === null) continue;
    for (const vehicle of vehicles) {
      if (row.metric?.(vehicle) === best) {
        wins.get(vehicle.id)?.push(row.label);
      }
    }
  }
  return wins;
}

/** Only crowns a winner when one vehicle clearly leads — a single-category
 * win among three metrics isn't a meaningful "best match" signal. */
function findBestMatch(
  vehicles: Vehicle[],
  wins: Map<string, string[]>
): { vehicle: Vehicle; wonLabels: string[] } | null {
  if (vehicles.length < 2) return null;
  let leaderId: string | null = null;
  let leaderCount = 0;
  let tied = false;

  wins.forEach((labels, id) => {
    if (labels.length > leaderCount) {
      leaderId = id;
      leaderCount = labels.length;
      tied = false;
    } else if (labels.length === leaderCount && leaderCount > 0) {
      tied = true;
    }
  });

  if (!leaderId || tied || leaderCount < 2) return null;
  const vehicle = vehicles.find((v) => v.id === leaderId);
  return vehicle ? { vehicle, wonLabels: wins.get(leaderId) ?? [] } : null;
}

function formatWinList(labels: string[]): string {
  const lower = labels.map((label) => label.toLowerCase());
  if (lower.length === 1) return lower[0];
  if (lower.length === 2) return `${lower[0]} and ${lower[1]}`;
  return `${lower.slice(0, -1).join(", ")}, and ${lower[lower.length - 1]}`;
}

export function VehicleCompareTable({ vehicles }: { vehicles: Vehicle[] }) {
  const wins = scoreVehicles(vehicles);
  const bestMatch = findBestMatch(vehicles, wins);

  return (
    <div className="space-y-4">
      {bestMatch && (
        <div className="flex items-start gap-3 rounded-xl border border-accent/30 bg-gold-light px-4 py-3.5 sm:px-5 sm:py-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Crown className="h-4.5 w-4.5" />
          </span>
          <p className="text-sm font-medium text-gold-800">
            <span className="font-extrabold">
              {bestMatch.vehicle.year} {bestMatch.vehicle.make}{" "}
              {bestMatch.vehicle.model}
            </span>{" "}
            is the best match here, it wins on{" "}
            <span className="font-bold">
              {formatWinList(bestMatch.wonLabels)}
            </span>
            .
          </p>
        </div>
      )}

      {/* Mobile: attribute rows with all vehicles visible side by side */}
      <MobileCompare
        vehicles={vehicles}
        bestMatchId={bestMatch?.vehicle.id ?? null}
      />

      {/* Desktop: original side-by-side table (unchanged) */}
      <DesktopCompareTable vehicles={vehicles} bestMatch={bestMatch} />
    </div>
  );
}

function MobileCompare({
  vehicles,
  bestMatchId,
}: {
  vehicles: Vehicle[];
  bestMatchId: string | null;
}) {
  const multiColumn = vehicles.length > 2;

  return (
    <div className="space-y-3 md:hidden">
      <div
        className={cn(
          multiColumn
            ? "flex gap-3 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            : "grid grid-cols-2 gap-3"
        )}
      >
        {vehicles.map((vehicle) => {
          const otherIds = vehicles
            .filter((v) => v.id !== vehicle.id)
            .map((v) => v.id);
          const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
          const isWinner = bestMatchId === vehicle.id;

          return (
            <article
              key={vehicle.id}
              className={cn(
                "overflow-hidden rounded-xl border border-border/70 bg-white shadow-card",
                isWinner && "border-accent/40 ring-1 ring-accent/30",
                multiColumn && "w-[78%] max-w-[18rem] shrink-0 snap-center"
              )}
            >
              {isWinner && (
                <div className="flex items-center justify-center gap-1 bg-accent px-2 py-1.5 text-[11px] font-bold uppercase tracking-wide text-accent-foreground">
                  <Crown className="h-3 w-3" />
                  Best Match
                </div>
              )}
              <div className="relative p-2.5 pb-0">
                <VehicleCompareImage
                  vehicle={vehicle}
                  sizes="(max-width: 768px) 45vw, 200px"
                />
                <Link
                  href={buildCompareUrl(otherIds)}
                  aria-label={`Remove ${vehicleLabel} from comparison`}
                  className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-card"
                >
                  <X className="h-4 w-4" />
                </Link>
              </div>
              <div className="p-2.5 pt-2">
                <Link
                  href={ROUTES.vehicleDetail(vehicle.id)}
                  className="block text-sm font-bold leading-snug text-primary hover:underline"
                >
                  {vehicleLabel}
                </Link>
                <p className="truncate text-xs text-muted-foreground">
                  {vehicle.trim}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {multiColumn && (
        <p className="text-center text-xs text-muted-foreground">
          Swipe headers sideways to see every vehicle
        </p>
      )}

      <div className="space-y-2.5">
        {SPEC_ROWS.map((row) => {
          const bestValue = bestValueForRow(row, vehicles);
          const Icon = row.icon;

          return (
            <div
              key={row.label}
              className="overflow-hidden rounded-xl border border-border/70 bg-white"
            >
              <div className="flex items-center gap-2 border-b border-border/60 bg-secondary/50 px-3 py-2">
                <Icon className="h-3.5 w-3.5 text-primary/60" />
                <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  {row.label}
                </span>
              </div>
              <div
                className={cn(
                  multiColumn
                    ? "flex overflow-x-auto overscroll-x-contain [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    : "grid grid-cols-2"
                )}
              >
                {vehicles.map((vehicle, index) => {
                  const isBest =
                    bestValue !== null &&
                    row.metric?.(vehicle) === bestValue;
                  const isWinnerColumn = bestMatchId === vehicle.id;

                  return (
                    <div
                      key={vehicle.id}
                      className={cn(
                        "p-3 font-semibold text-primary",
                        index > 0 && "border-l border-border/50",
                        isBest && "bg-success/10",
                        !isBest && isWinnerColumn && "bg-gold-light/40",
                        multiColumn &&
                          "w-[78%] max-w-[18rem] shrink-0 snap-center"
                      )}
                    >
                      <div className="flex flex-wrap items-center gap-1.5">
                        {row.render(vehicle)}
                        {isBest && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                            <BadgeCheck className="h-3 w-3" />
                            Best
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DesktopCompareTable({
  vehicles,
  bestMatch,
}: {
  vehicles: Vehicle[];
  bestMatch: { vehicle: Vehicle; wonLabels: string[] } | null;
}) {
  return (
    <div className="hidden overflow-x-auto rounded-2xl border border-border/70 bg-white shadow-card md:block">
      <table className="w-full min-w-[680px] table-fixed border-collapse text-sm">
        <thead>
          <tr>
            <th
              scope="col"
              className="sticky left-0 z-20 w-40 border-b border-border/70 bg-white p-4 align-bottom"
            />
            {vehicles.map((vehicle) => {
              const otherIds = vehicles
                .filter((v) => v.id !== vehicle.id)
                .map((v) => v.id);
              const vehicleHref = ROUTES.vehicleDetail(vehicle.id);
              const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
              const isWinner = bestMatch?.vehicle.id === vehicle.id;

              return (
                <th
                  key={vehicle.id}
                  scope="col"
                  style={{ width: `${86 / vehicles.length}%` }}
                  className={cn(
                    "border-b border-l border-border/60 p-4 pt-3 text-left align-bottom font-normal",
                    isWinner ? "bg-gold-light" : "bg-white"
                  )}
                >
                  <div
                    className={cn(
                      "-mx-4 -mt-3 mb-3 h-1.5",
                      isWinner ? "bg-accent" : "bg-transparent"
                    )}
                  />
                  {isWinner && (
                    <span className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-accent-foreground">
                      <Crown className="h-3 w-3" />
                      Best Match
                    </span>
                  )}
                  <div className="relative">
                    <VehicleCompareImage
                      vehicle={vehicle}
                      sizes={`(max-width: 640px) 88vw, ${Math.round(86 / vehicles.length)}vw`}
                    />
                    <Link
                      href={buildCompareUrl(otherIds)}
                      aria-label={`Remove ${vehicleLabel} from comparison`}
                      className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-card transition-colors hover:bg-white hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Link>
                  </div>
                  <Link
                    href={vehicleHref}
                    className="mt-3 block font-bold leading-snug text-primary hover:underline"
                  >
                    {vehicleLabel}
                  </Link>
                  <p className="text-xs font-normal text-muted-foreground">
                    {vehicle.trim}
                  </p>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {SPEC_ROWS.map((row, index) => {
            const bestValue = bestValueForRow(row, vehicles);
            const Icon = row.icon;

            return (
              <tr
                key={row.label}
                className={cn(
                  "transition-colors hover:bg-secondary/40",
                  index % 2 === 1 && "bg-secondary/20"
                )}
              >
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-border/50 bg-inherit p-4 text-left"
                >
                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    <Icon className="h-3.5 w-3.5 text-primary/60" />
                    {row.label}
                  </span>
                </th>
                {vehicles.map((vehicle) => {
                  const isBest =
                    bestValue !== null &&
                    row.metric?.(vehicle) === bestValue;
                  const isWinnerColumn =
                    bestMatch?.vehicle.id === vehicle.id;

                  return (
                    <td
                      key={vehicle.id}
                      className={cn(
                        "border-b border-l border-border/40 p-4 font-semibold text-primary",
                        isBest && "bg-success/10",
                        !isBest && isWinnerColumn && "bg-gold-light/40"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        {row.render(vehicle)}
                        {isBest && (
                          <span className="inline-flex items-center gap-0.5 rounded-full bg-success/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-success">
                            <BadgeCheck className="h-3 w-3" />
                            Best
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
