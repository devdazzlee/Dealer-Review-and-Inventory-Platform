import { notFound, permanentRedirect } from "next/navigation";
import { getVehicleByIdFromApi } from "@/lib/api/vehicles";
import { ROUTES } from "@/config/constants";

interface LegacyVehiclePageProps {
  // Next.js requires the same dynamic-segment name at this position as the
  // nested [dealer-slug]/[vehicle-slug] route below, so this folder is named
  // "dealer-slug" even though a legacy single-segment URL actually carries a
  // raw vehicle id/VIN here, not a real dealer slug.
  params: { "dealer-slug": string };
}

/**
 * Legacy raw-id URL (`/vehicles/<cuid-or-vin>`), kept only so previously
 * indexed/bookmarked links still resolve. Looks the vehicle up the same way
 * the old detail page did (repository accepts either id or VIN), then
 * permanently redirects to the SEO-friendly dealer-slug/vehicle-slug URL —
 * `permanentRedirect` issues a 308, which search engines treat the same as
 * a 301 for transferring link equity, while a plain `redirect()` would be
 * a temporary 307 and wouldn't pass that signal on.
 */
export default async function LegacyVehiclePage({
  params,
}: LegacyVehiclePageProps) {
  let vehicle;
  try {
    const payload = await getVehicleByIdFromApi(params["dealer-slug"]);
    vehicle = payload.vehicle;
  } catch {
    notFound();
  }

  permanentRedirect(ROUTES.vehicleDetail(vehicle.dealer.slug, vehicle.slug));
}
