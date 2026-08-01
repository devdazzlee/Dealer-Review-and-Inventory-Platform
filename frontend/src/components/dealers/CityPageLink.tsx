import Link from "next/link";
import { getCityByNameAndState } from "@/config/locations";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

interface CityPageLinkProps {
  city: string;
  state: string;
  className?: string;
  /** When true, only the city name is linked (state stays plain text after comma). */
  cityOnly?: boolean;
}

export function CityPageLink({
  city,
  state,
  className,
  cityOnly = false,
}: CityPageLinkProps) {
  const target = getCityByNameAndState(city, state);
  const href = target ? ROUTES.dealerCity(target.slug) : null;

  if (!href) {
    return (
      <span className={className}>
        {cityOnly ? city : `${city}, ${state}`}
      </span>
    );
  }

  if (cityOnly) {
    return (
      <Link href={href} prefetch={false} className={cn("font-semibold hover:underline", className)}>
        {city}
      </Link>
    );
  }

  return (
    <Link href={href} prefetch={false} className={cn("hover:underline", className)}>
      {city}, {state}
    </Link>
  );
}
