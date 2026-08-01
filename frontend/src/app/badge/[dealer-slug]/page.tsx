import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { env } from "@/config/env";
import { ExcellenceBadge } from "@/components/badge/ExcellenceBadge";
import { ClientPrint } from "@/components/badge/ClientPrint";
import { ROUTES } from "@/config/constants";

interface BadgePageProps {
  params: { "dealer-slug": string };
}

async function fetchBadge(slug: string) {
  const response = await fetch(`${env.apiBaseUrl}/api/badge/${slug}`, {
    next: { revalidate: 60 },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Failed to load badge");
  return response.json() as Promise<{
    dealerName: string;
    slug: string;
    badgeYear: number;
    combinedRating: number | null;
    totalReviews: number;
    profileUrl: string;
  }>;
}

export async function generateMetadata({
  params,
}: BadgePageProps): Promise<Metadata> {
  const data = await fetchBadge(params["dealer-slug"]).catch(() => null);
  if (!data) return { title: "Badge Not Found" };
  return {
    title: `${data.dealerName} Dealer Excellence Award ${data.badgeYear}`,
    description: `AutoSalesReviews Dealer Excellence Award presented to ${data.dealerName}.`,
  };
}

export default async function BadgePage({ params }: BadgePageProps) {
  const data = await fetchBadge(params["dealer-slug"]);
  if (!data) notFound();

  return (
    <div className="min-h-screen bg-white px-4 py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-[720px]">
        <ExcellenceBadge
          dealerName={data.dealerName}
          year={data.badgeYear}
          combinedRating={data.combinedRating}
        />
        <div className="mt-6 flex flex-wrap justify-center gap-3 print:hidden">
          <Link
            href={ROUTES.dealerProfile(data.slug)}
            className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-bold text-white hover:bg-navy-600"
          >
            View dealer profile
          </Link>
          <ClientPrint />
        </div>
      </div>
    </div>
  );
}
