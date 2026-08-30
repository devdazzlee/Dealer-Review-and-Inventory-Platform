"use client";

import { usePathname } from "next/navigation";

/** Standalone dashboards that render their own full-screen shell — never the
 * public site navbar/footer. */
const CHROMELESS_PREFIXES = ["/admin", "/dealer-portal"];

/**
 * Client shell for admin/dealer-portal vs public chrome only.
 * Navbar/footer are passed as slots from the server layout so Footer (and its
 * tree) stay Server Components and out of the shared client hydration bundle.
 */
export function SiteChrome({
  navbar,
  footer,
  children,
}: {
  navbar: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChromeless = CHROMELESS_PREFIXES.some((prefix) =>
    pathname?.startsWith(prefix)
  );

  if (isChromeless) {
    return <main className="flex-1">{children}</main>;
  }

  return (
    <>
      {navbar}
      <main className="flex-1 pt-16">{children}</main>
      {footer}
    </>
  );
}
