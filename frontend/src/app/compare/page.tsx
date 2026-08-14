import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale } from "lucide-react";
import { getVehicleByIdFromApi } from "@/lib/api/vehicles";
import { parseCompareIds } from "@/lib/vehicles/compare";
import { ROUTES, SITE } from "@/config/constants";
import { formatPrice } from "@/lib/utils/format";
import { VehicleCompareTable } from "@/components/vehicles/VehicleCompareTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import type { VehicleSearchParams } from "@/lib/vehicles/filters";

export const metadata: Metadata = {
  title: `Compare Vehicles | ${SITE.name}`,
  description:
    "Compare vehicles side by side by price, mileage, specs, and dealer ratings.",
  // Every visit builds a different ?ids= permutation, so this utility page
  // stays out of search results rather than competing with the real listing pages.
  robots: { index: false, follow: true },
};

interface ComparePageProps {
  searchParams: VehicleSearchParams;
}

export default async function ComparePage({ searchParams }: ComparePageProps) {
  const ids = parseCompareIds(searchParams.ids);
  const vehicles = (
    await Promise.all(
      ids.map(async (id) => {
        try {
          const result = await getVehicleByIdFromApi(id);
          return result.vehicle;
        } catch {
          return null;
        }
      })
    )
  ).filter((vehicle): vehicle is NonNullable<typeof vehicle> => vehicle !== null);

  const prices = vehicles.map((v) => v.price);
  const priceRange =
    vehicles.length > 1
      ? `${formatPrice(Math.min(...prices))} – ${formatPrice(Math.max(...prices))}`
      : null;

  return (
    <div className="bg-background pb-28 md:pb-0">
      <div className="container-page py-6 sm:py-8">
        <Link
          href={ROUTES.vehicles}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to all vehicles
        </Link>

        <div className="mb-6 mt-4 flex items-start gap-4 sm:mb-8">
          <span className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary text-white sm:flex">
            <Scale className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-primary sm:text-3xl md:text-4xl">
              Compare Vehicles
            </h1>
            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
              Side by side, so you don&apos;t have to open five tabs to figure
              out which one wins.
            </p>
            {vehicles.length > 0 && (
              <p className="mt-3 inline-flex max-w-full flex-wrap items-center gap-2 rounded-full bg-secondary px-3.5 py-1.5 text-sm font-semibold text-primary">
                Comparing {vehicles.length}{" "}
                {vehicles.length === 1 ? "vehicle" : "vehicles"}
                {priceRange && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    {priceRange}
                  </>
                )}
              </p>
            )}
          </div>
        </div>

        {vehicles.length === 0 ? (
          <EmptyState
            icon={Scale}
            title="No vehicles selected"
            description="Check the Compare box on any vehicle to add it here, then come back to see them side by side."
            action={
              <Button asChild variant="gold">
                <Link href={ROUTES.vehicles}>Browse Vehicles</Link>
              </Button>
            }
          />
        ) : (
          <VehicleCompareTable vehicles={vehicles} />
        )}
      </div>
    </div>
  );
}
