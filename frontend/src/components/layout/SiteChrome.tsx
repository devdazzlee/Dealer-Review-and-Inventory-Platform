"use client";

import { usePathname } from "next/navigation";

/**
 * Client shell for admin vs public chrome only.
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
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) {
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
