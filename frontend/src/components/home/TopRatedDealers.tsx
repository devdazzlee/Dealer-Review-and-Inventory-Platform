import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getDealers } from "@/lib/api/dealers";
import { enrichDealerSummary } from "@/lib/dealers/enrich";
import { ROUTES } from "@/config/constants";
import { DealerListCard } from "@/components/dealers/DealerListCard";
import type { UserLocation } from "@/lib/location/location-cookie";
import type { DealerCardData } from "@/lib/dealers/enrich";

const SHOWN = 3;

export async function TopRatedDealers({
  location,
}: {
  location?: UserLocation;
}) {
  let dealers: DealerCardData[] = [];

  try {
    // The API sorts (featured first, then combined rating) and returns only
    // the top few; asking for every dealer meant a 1.3MB response for 3 cards.
    const area = location?.stateCode ? { state: location.stateCode } : {};
    const [inArea, inCity] = await Promise.all([
      getDealers({ ...area, top: SHOWN }),
      location?.city
        ? getDealers({ ...area, city: location.city, top: SHOWN })
        : Promise.resolve([]),
    ]);

    // Dealers in the visitor's own city go first, then the rest of the area.
    const local = inCity.filter(
      (d) => d.city.toLowerCase() === location?.city.toLowerCase()
    );
    const localSlugs = new Set(local.map((d) => d.slug));
    dealers = [...local, ...inArea.filter((d) => !localSlugs.has(d.slug))]
      .slice(0, SHOWN)
      .map(enrichDealerSummary);
  } catch {
    dealers = [];
  }

  const isPersonalized =
    !!location &&
    dealers.some((d) => d.city.toLowerCase() === location.city.toLowerCase());

  if (dealers.length === 0) {
    return null;
  }

  return (
    <section className="bg-background">
      <div className="container-page py-16">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              {isPersonalized
                ? `Top Rated Dealerships Near ${location!.city}`
                : "Top Rated Dealerships"}
            </h2>
            <p className="mt-2 text-muted-foreground">
              Highly reviewed dealers with verified combined ratings.
            </p>
          </div>
          <Link
            href={ROUTES.dealers}
            prefetch={false}
            className="hidden shrink-0 items-center gap-1 text-sm font-bold text-primary hover:underline sm:inline-flex"
          >
            View All Dealers
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="space-y-4">
          {dealers.map((dealer) => (
            <DealerListCard key={dealer.slug} dealer={dealer} compact />
          ))}
        </div>
      </div>
    </section>
  );
}
