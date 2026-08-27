import { Search } from "lucide-react";
import Link from "next/link";
import { getDealersPaginated } from "@/lib/api/dealers";
import { getRegion } from "@/config/constants";
import { enrichDealerSummary } from "@/lib/dealers/enrich";
import { DealerListCard } from "@/components/dealers/DealerListCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { RetryButton } from "@/components/shared/RetryButton";
import { Button } from "@/components/ui/button";
import { DealerQueryParams } from "@/types/dealer";

interface DealerResultsProps {
  searchParams: DealerQueryParams;
  emptyTitle?: string;
  emptyDescription?: string;
}

function pageHref(searchParams: DealerQueryParams, page: number): string {
  const params = new URLSearchParams();
  if (searchParams.state) params.set("state", searchParams.state);
  if (searchParams.region) params.set("region", searchParams.region);
  if (searchParams.city) params.set("city", searchParams.city);
  if (searchParams.minRating) params.set("minRating", searchParams.minRating);
  if (searchParams.search) params.set("search", searchParams.search);
  params.set("page", String(page));
  return `?${params.toString()}`;
}

export async function DealerResults({
  searchParams,
  emptyTitle = "No dealers found",
  emptyDescription = "We couldn't find any dealerships matching your criteria. Try broadening your search or clearing some filters.",
}: DealerResultsProps) {
  try {
    const { data, total, page, totalPages } =
      await getDealersPaginated(searchParams);
    const region = getRegion(searchParams.region);

    if (data.length === 0) {
      return (
        <EmptyState
          icon={Search}
          title={emptyTitle}
          description={emptyDescription}
        />
      );
    }

    const enriched = data.map(enrichDealerSummary);

    return (
      <div>
        <p className="mb-4 text-sm font-semibold text-muted-foreground">
          Showing {data.length} of {total}{" "}
          {total === 1 ? "dealership" : "dealerships"}
          {region ? ` in the ${region.label}` : ""}
        </p>
        <div className="space-y-4">
          {enriched.map((dealer) => (
            <DealerListCard key={dealer.slug} dealer={dealer} />
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3 border-t border-border/70 pt-6">
            {page > 1 ? (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(searchParams, page - 1)}>Previous</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
            )}
            <span className="min-w-[6.5rem] text-center text-sm font-medium text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Button asChild variant="outline" size="sm">
                <Link href={pageHref(searchParams, page + 1)}>Next</Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            )}
          </div>
        )}
      </div>
    );
  } catch {
    return (
      <ErrorState
        title="Unable to load dealers"
        message="Something went wrong while fetching dealerships. Please check that the backend API is running and try again."
        action={<RetryButton />}
      />
    );
  }
}
