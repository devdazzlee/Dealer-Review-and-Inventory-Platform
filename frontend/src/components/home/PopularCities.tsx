import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { ROUTES } from "@/config/constants";
import { HOMEPAGE_POPULAR_CITIES } from "@/config/locations";

export function PopularCities() {
  return (
    <section className="bg-background">
      <div className="container-page py-16 lg:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-text">
              Local markets
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Popular cities
            </h2>
            <p className="mt-2 text-muted-foreground">
              Browse trusted dealerships in high-demand metro areas across the
              U.S.
            </p>
          </div>
          <Link
            href={ROUTES.cities}
            prefetch={false}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            View all cities
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {HOMEPAGE_POPULAR_CITIES.map(({ city, stateCode, slug }) => (
            <Link
              key={slug}
              href={ROUTES.dealerCity(slug)}
              prefetch={false}
              className="group flex items-center gap-3 rounded-2xl border border-border/70 bg-white p-4 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover sm:p-5"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
                <MapPin className="h-4 w-4" strokeWidth={1.75} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold text-primary">
                  {city}
                </span>
                <span className="block text-sm font-medium text-accent-text">
                  {stateCode}
                </span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-primary/60 transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
