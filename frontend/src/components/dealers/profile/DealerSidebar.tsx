import { Globe, Mail, MapPin, Navigation, Phone } from "lucide-react";
import { CityPageLink } from "@/components/dealers/CityPageLink";
import type { DealerDetail } from "@/types/dealer";
import { formatPhone, stripProtocol } from "@/lib/utils/format";
import { Button } from "@/components/ui/button";

export function DealerSidebar({ dealer }: { dealer: DealerDetail }) {
  const fullAddress = [dealer.address, `${dealer.city}, ${dealer.state} ${dealer.zip}`]
    .filter(Boolean)
    .join(", ");
  const mapsHref = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${dealer.name} ${fullAddress}`
  )}`;

  return (
    <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
      <div className="rounded-lg border border-border/70 bg-white p-5 shadow-card">
        <h3 className="mb-4 text-base font-bold text-primary">
          Contact {dealer.name}
        </h3>
        <ul className="space-y-3 text-sm">
          {dealer.phone && (
            <li>
              <a
                href={`tel:${dealer.phone.replace(/\D/g, "")}`}
                className="flex items-center gap-3 text-foreground hover:text-primary"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <Phone className="h-4 w-4" />
                </span>
                <span className="font-semibold">{formatPhone(dealer.phone)}</span>
              </a>
            </li>
          )}
          {dealer.email && (
            <li>
              <a
                href={`mailto:${dealer.email}`}
                className="flex items-center gap-3 text-foreground hover:text-primary"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <Mail className="h-4 w-4" />
                </span>
                <span className="truncate">{dealer.email}</span>
              </a>
            </li>
          )}
          {dealer.website && (
            <li>
              <a
                href={dealer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-foreground hover:text-primary"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
                  <Globe className="h-4 w-4" />
                </span>
                <span className="truncate">{stripProtocol(dealer.website)}</span>
              </a>
            </li>
          )}
          <li className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-secondary text-primary">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="text-muted-foreground">
              {dealer.address ? `${dealer.address}, ` : ""}
              <CityPageLink
                city={dealer.city}
                state={dealer.state}
                cityOnly
                className="hover:text-primary"
              />
              , {dealer.state} {dealer.zip}
            </span>
          </li>
        </ul>

        <Button asChild variant="gold" className="mt-4 w-full">
          <a href={mapsHref} target="_blank" rel="noopener noreferrer">
            <Navigation className="h-4 w-4" />
            Get Directions
          </a>
        </Button>
      </div>

      {/* Map placeholder */}
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex h-44 items-center justify-center overflow-hidden rounded-lg border border-border/70 bg-photo-placeholder shadow-card"
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,48,135,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(0,48,135,0.08) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
          aria-hidden
        />
        <div className="relative flex flex-col items-center gap-2 text-primary">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-white shadow-md transition-transform group-hover:scale-110">
            <MapPin className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold">Get Directions</span>
        </div>
      </a>
    </aside>
  );
}
