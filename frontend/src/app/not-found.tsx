import Link from "next/link";
import { ArrowRight, Car, MapPin, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ROUTES, SITE } from "@/config/constants";

export default function NotFound() {
  return (
    <div className="relative overflow-hidden bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-hero-texture opacity-40"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-[-10%] h-72 w-72 rounded-full bg-accent/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-28 left-[-8%] h-80 w-80 rounded-full bg-primary/10 blur-3xl"
      />

      <div className="container-page relative flex min-h-[70vh] flex-col items-center justify-center py-20 text-center sm:py-28">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.2em] text-accent-text">
          {SITE.name}
        </p>

        <p
          className="font-sans text-[6.5rem] font-bold leading-none tracking-tight text-primary sm:text-[8rem]"
          aria-hidden
        >
          404
        </p>

        <div className="mx-auto mt-2 h-1 w-16 rounded-full bg-accent" aria-hidden />

        <h1 className="mt-8 max-w-xl text-3xl font-bold tracking-tight text-primary sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
          The page you&apos;re looking for doesn&apos;t exist or may have moved.
          Browse dealers and inventory to get back on track.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" variant="gold">
            <Link href={ROUTES.home}>
              Back to home
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href={ROUTES.dealers}>Browse dealers</Link>
          </Button>
        </div>

        <nav
          aria-label="Popular destinations"
          className="mt-14 grid w-full max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3"
        >
          {[
            {
              href: ROUTES.vehicles,
              label: "Find cars",
              hint: "Search inventory",
              icon: Car,
            },
            {
              href: ROUTES.dealers,
              label: "Dealers",
              hint: "Trusted dealerships",
              icon: Store,
            },
            {
              href: ROUTES.cities,
              label: "Cities",
              hint: "Shop by location",
              icon: MapPin,
            },
          ].map(({ href, label, hint, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-3 rounded-lg border border-border/70 bg-card px-4 py-3.5 text-left shadow-card transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-card-hover"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                <Icon className="h-5 w-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-primary">{label}</span>
                <span className="block text-xs text-muted-foreground">{hint}</span>
              </span>
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
