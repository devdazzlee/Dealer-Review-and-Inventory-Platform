import { notFound } from "next/navigation";
import { PenSquare } from "lucide-react";
import { getDealerBySlug } from "@/lib/api/dealers";
import { enrichDealerSummary } from "@/lib/dealers/enrich";
import { getVehiclesByDealerSlug } from "@/lib/vehicles/data";
import { dealerDescription } from "@/lib/dealers/mock";
import { DealerProfileHero } from "@/components/dealers/profile/DealerProfileHero";
import { LocationFaqSection } from "@/components/dealers/LocationFaqSection";
import { SchemaMarkup } from "@/components/seo/SchemaMarkup";
import { SeoContentSection } from "@/components/seo/SeoContentSection";
import { buildAutoDealerSchema, buildFaqPageSchema } from "@/lib/schema/builders";
import {
  buildDealerProfileFaqItems,
  buildDealerProfileSeoContent,
} from "@/config/seo-content";
import { DealerProfileTabs } from "@/components/dealers/profile/DealerProfileTabs";
import { DealerSidebar } from "@/components/dealers/profile/DealerSidebar";
import { ErrorState } from "@/components/shared/ErrorState";
import { RetryButton } from "@/components/shared/RetryButton";
import { ApiError } from "@/types/dealer";

interface DealerProfileContentProps {
  slug: string;
}

export async function DealerProfileContent({ slug }: DealerProfileContentProps) {
  try {
    const dealer = await getDealerBySlug(slug);
    const ratings = enrichDealerSummary(dealer).ratings;
    const vehicles = getVehiclesByDealerSlug(slug);
    const description =
      dealer.description ||
      dealerDescription(dealer.name, dealer.city, dealer.state);
    const faqItems = buildDealerProfileFaqItems(dealer);
    const faqSchema = buildFaqPageSchema(faqItems);

    return (
      <>
        <SchemaMarkup
          data={[
            buildAutoDealerSchema(dealer, ratings),
            ...(faqSchema ? [faqSchema] : []),
          ]}
        />
        <div className="pb-20 lg:pb-0">
          <div className="container-page py-6 lg:py-8">
            <div className="mb-6">
              <DealerProfileHero dealer={dealer} ratings={ratings} />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px] lg:gap-8">
              <div>
                <DealerProfileTabs
                  dealerSlug={dealer.slug}
                  dealerName={dealer.name}
                  description={description}
                  vehicles={vehicles}
                />
              </div>
              <DealerSidebar dealer={dealer} />
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/70 bg-white p-3 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] lg:hidden">
            <a
              href="#write-review"
              className="flex h-11 items-center justify-center gap-2 rounded-lg bg-accent text-sm font-bold text-accent-foreground"
            >
              <PenSquare className="h-4 w-4" />
              Write a Review
            </a>
          </div>
        </div>

        <LocationFaqSection
          items={faqItems}
          title={`FAQs about ${dealer.name}`}
        />

        <SeoContentSection
          content={buildDealerProfileSeoContent({
            name: dealer.name,
            city: dealer.city,
            state: dealer.state,
            slug: dealer.slug,
          })}
          variant="muted"
        />
      </>
    );
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }

    return (
      <div className="container-page py-10">
        <ErrorState
          title="Unable to load dealer"
          message="Something went wrong while fetching this dealership. Please try again."
          action={<RetryButton />}
        />
      </div>
    );
  }
}
