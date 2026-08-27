import type { Metadata } from "next";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DealerProfileContent } from "@/components/dealers/DealerProfileContent";
import { DealerProfileSkeleton } from "@/components/dealers/DealerProfileSkeleton";
import { getDealerBySlug } from "@/lib/api/dealers";
import { buildDealerProfileMetadata } from "@/config/seo";
import { ApiError } from "@/types/dealer";

interface DealerProfilePageProps {
  params: { slug: string };
}

export async function generateMetadata({
  params,
}: DealerProfilePageProps): Promise<Metadata> {
  try {
    const dealer = await getDealerBySlug(params.slug);
    return buildDealerProfileMetadata({
      name: dealer.name,
      slug: params.slug,
      city: dealer.city,
      state: dealer.state,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }
}

/**
 * The existence check has to happen here, in the page's own synchronous
 * render path, not inside DealerProfileContent's Suspense boundary —
 * Next.js has already started streaming a 200 response by the time a
 * suspended component resolves, so a notFound() called from inside the
 * fallback-wrapped content can't retroactively change the status code.
 * The dealer fetch itself is deduped (same URL, same options) with the one
 * DealerProfileContent makes, so this doesn't cost a second real request.
 */
export default async function DealerProfilePage({
  params,
}: DealerProfilePageProps) {
  try {
    await getDealerBySlug(params.slug);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <Suspense fallback={<DealerProfileSkeleton />}>
      <DealerProfileContent slug={params.slug} />
    </Suspense>
  );
}
