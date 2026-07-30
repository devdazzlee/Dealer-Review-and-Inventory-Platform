import Link from "next/link";
import {
  ArrowRight,
  Factory,
  Flame,
  Landmark,
  MapPin,
  Mountain,
  Sun,
  type LucideIcon,
} from "lucide-react";
import { REGIONS, ROUTES } from "@/config/constants";
import { TOP_CITIES_SERVED } from "@/config/locations";
import { cn } from "@/lib/utils";

const DEALER_COUNTS: Record<string, number> = {
  northeast: 128,
  southeast: 142,
  midwest: 118,
  southwest: 76,
  west: 134,
};

const REGION_ICONS: Record<string, LucideIcon> = {
  northeast: Landmark,
  southeast: Sun,
  midwest: Factory,
  southwest: Flame,
  west: Mountain,
};

/** Soft brand tints so each region reads with color at rest, not only on hover. */
const REGION_ACCENTS: Record<string, string> = {
  northeast: "bg-[#E8EEF7]",
  southeast: "bg-[#FDF6E3]",
  midwest: "bg-[#EAF3F0]",
  southwest: "bg-[#F8EEE8]",
  west: "bg-[#EEF1F8]",
};

export function BrowseByRegion() {
  return (
    <section className="bg-background">
      <div className="container-page py-16 lg:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-text">
              Nationwide coverage
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Find dealers by region
            </h2>
            <p className="mt-2 text-muted-foreground">
              Pick a region to browse trusted dealerships, or jump into a top
              market below.
            </p>
          </div>
          <Link
            href={ROUTES.dealers}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            Browse all dealers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_300px] lg:gap-12">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {REGIONS.map((region) => {
              const Icon = REGION_ICONS[region.key];
              const count = DEALER_COUNTS[region.key];

              return (
                <Link
                  key={region.key}
                  href={`${ROUTES.dealers}?region=${region.key}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/70 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover"
                >
                  <div
                    className={cn(
                      "absolute inset-x-0 top-0 h-1.5",
                      region.key === "southeast" || region.key === "southwest"
                        ? "bg-accent"
                        : "bg-primary"
                    )}
                    aria-hidden
                  />

                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={cn(
                        "flex h-11 w-11 items-center justify-center rounded-xl text-primary",
                        REGION_ACCENTS[region.key]
                      )}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.75} />
                    </span>
                    <ArrowRight className="mt-1 h-4 w-4 text-primary/50 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>

                  <p className="mt-4 text-lg font-bold text-primary">
                    {region.label}
                  </p>
                  <p className="mt-1 text-sm leading-snug text-muted-foreground">
                    {region.blurb}
                  </p>
                  <span className="mt-4 inline-flex w-fit items-center rounded-full bg-secondary px-2.5 py-1 text-xs font-bold text-primary">
                    {count} dealers
                  </span>
                </Link>
              );
            })}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-card">
              <div className="border-b border-border/70 bg-primary px-5 py-4">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" strokeWidth={2} />
                  <h3 className="font-bold text-white">Top cities</h3>
                </div>
                <p className="mt-1 text-sm text-white/80">
                  Jump straight to inventory in major markets.
                </p>
              </div>

              <ol className="divide-y divide-border/60">
                {TOP_CITIES_SERVED.map((city, index) => {
                  const isTop = index === 0;

                  return (
                    <li key={city.slug}>
                      <Link
                        href={`${ROUTES.vehicles}?city=${encodeURIComponent(city.city)}&state=${city.stateCode}`}
                        className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-secondary/60"
                      >
                        <span
                          className={cn(
                            "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold tabular-nums",
                            isTop
                              ? "bg-accent text-accent-foreground"
                              : "bg-secondary text-primary"
                          )}
                        >
                          {index + 1}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-primary">
                          {city.city}, {city.stateCode}
                        </span>
                        <span className="shrink-0 text-xs font-semibold tabular-nums text-accent-foreground/70">
                          {city.vehicleCount.toLocaleString("en-US")}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
