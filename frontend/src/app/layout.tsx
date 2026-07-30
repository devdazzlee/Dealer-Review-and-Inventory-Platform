import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { GoogleAnalytics } from "@/components/analytics/GoogleAnalytics";
import { DealerNavigationProvider } from "@/contexts/dealer-navigation-context";
import { UserLocationProvider } from "@/contexts/user-location-context";
import { LocationPromptModalLazy as LocationPromptModal } from "@/components/home/LocationPromptModalLazy";
import { CompareProvider } from "@/contexts/compare-context";
import { SavedVehiclesProvider } from "@/contexts/saved-vehicles-context";
import { CompareTray } from "@/components/vehicles/CompareTray";
import { PreventSelectScrollLock } from "@/components/shared/PreventSelectScrollLock";
import { SITE } from "@/config/constants";
import { INDEXABLE_ROBOTS } from "@/config/seo";
import { getMetadataBase } from "@/lib/seo";

// Only weights we actually use. LCP headings use font-bold (700) — do not add
// 800 unless preload includes it, or paint waits on synthetic bold / extra fetch.
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  weight: ["400", "600", "700"],
  preload: true,
  adjustFontFallback: true,
});

export const metadata: Metadata = {
  metadataBase: getMetadataBase(),
  title: {
    default: SITE.name,
    template: `%s | ${SITE.name}`,
  },
  description: SITE.description,
  robots: INDEXABLE_ROBOTS,
  verification: {
    google: "uH0NcvaewFx90B1HkKZhtA363nR4POJUN5N7FnLKu54",
  },
  openGraph: {
    siteName: SITE.name,
    locale: "en_US",
    type: "website",
  },
  other: {
    publisher: SITE.name,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col antialiased font-sans">
        <GoogleAnalytics />
        <PreventSelectScrollLock />
        <UserLocationProvider>
          <CompareProvider>
            <SavedVehiclesProvider>
              <DealerNavigationProvider>
                <Navbar />
                <main className="flex-1 pt-16">{children}</main>
                <Footer />
                <LocationPromptModal />
                <CompareTray />
              </DealerNavigationProvider>
            </SavedVehiclesProvider>
          </CompareProvider>
        </UserLocationProvider>
      </body>
    </html>
  );
}
