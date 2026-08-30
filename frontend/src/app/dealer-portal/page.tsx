import type { Metadata } from "next";
import { DealerPortal } from "@/components/dealer-portal/DealerPortal";

export const metadata: Metadata = {
  title: "Dealer Portal | AutoSalesReviews",
  robots: { index: false, follow: false },
};

export default function DealerPortalPage() {
  return <DealerPortal />;
}
