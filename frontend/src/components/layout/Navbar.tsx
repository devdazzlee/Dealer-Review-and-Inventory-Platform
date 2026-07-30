"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, PenSquare, Store } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { CitiesNavDropdownLazy as CitiesNavDropdown } from "@/components/layout/CitiesNavDropdownLazy";
import { SavedNavLink } from "@/components/layout/SavedNavLink";
import { NAV_LINKS, ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 8);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  function isActive(href: string) {
    if (href === ROUTES.home) return pathname === ROUTES.home;
    return pathname.startsWith(href);
  }

  const citiesActive =
    pathname.startsWith(ROUTES.cities) || pathname.startsWith("/dealers/city");

  return (
    <header
      className={cn(
        "fixed top-0 z-50 w-full border-b border-border/70 bg-white transition-shadow duration-300",
        scrolled ? "shadow-nav-scrolled" : "shadow-nav"
      )}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <BrandLogo />

        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch={"prefetch" in link ? link.prefetch : undefined}
              className={cn(
                "whitespace-nowrap rounded-md px-3.5 py-2 text-sm font-semibold transition-colors",
                isActive(link.href)
                  ? "bg-secondary text-primary"
                  : "text-slate-600 hover:bg-secondary hover:text-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
          <CitiesNavDropdown isActive={citiesActive} />
        </nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          <SavedNavLink className="px-3 py-2 text-slate-600 hover:bg-secondary hover:text-primary" />
          <Button asChild variant="outline" size="sm">
            <Link href={ROUTES.forDealers}>
              <Store className="h-4 w-4" />
              List Your Dealership
            </Link>
          </Button>
          <Button asChild variant="gold" size="sm">
            <Link href={ROUTES.writeReview}>
              <PenSquare className="h-4 w-4" />
              Write a Review
            </Link>
          </Button>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-primary transition-colors hover:bg-secondary lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 top-16 z-40 flex flex-col bg-white lg:hidden">
          <nav
            className="flex flex-col gap-1 px-4 py-6"
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={"prefetch" in link ? link.prefetch : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-4 py-3.5 text-base font-semibold transition-colors",
                  isActive(link.href)
                    ? "bg-secondary text-primary"
                    : "text-slate-700 hover:bg-secondary"
                )}
              >
                {link.label}
              </Link>
            ))}
            <CitiesNavDropdown
              variant="mobile"
              isActive={citiesActive}
              onNavigate={() => setMobileOpen(false)}
            />
            <SavedNavLink
              onNavigate={() => setMobileOpen(false)}
              className="rounded-lg px-4 py-3.5 text-base text-slate-700 hover:bg-secondary"
            />
          </nav>
          <div className="mt-auto flex flex-col gap-3 border-t border-border/70 px-4 py-6">
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href={ROUTES.forDealers}>
                <Store className="h-4 w-4" />
                List Your Dealership
              </Link>
            </Button>
            <Button asChild variant="gold" className="w-full" size="lg">
              <Link href={ROUTES.writeReview}>
                <PenSquare className="h-4 w-4" />
                Write a Review
              </Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
