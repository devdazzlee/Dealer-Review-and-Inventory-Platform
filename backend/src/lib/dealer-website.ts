/**
 * Domains that are lead-aggregator / listing-marketplace pages, not a
 * dealer's own site. The original Auto.dev import backfilled these as a
 * dealer's "website" whenever it had no real one, so treat them the same
 * as "no website" rather than a working site — using one as if it were the
 * dealer's own would misattribute a marketplace's identity (e.g. its logo)
 * to every dealer that shares it.
 */
const BLOCKED_WEBSITE_DOMAINS = new Set([
  "carfax.com",
  "autolist.com",
  "cars.com",
  "autotrader.com",
  "cargurus.com",
  "carvana.com",
  "truecar.com",
  "edmunds.com",
  "kbb.com",
  "vast.com",
  "driveway.com",
  "carsforsale.com",
  "vroom.com",
  "shift.com",
]);

export function websiteHostname(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return null;
  }
}

/** True when this URL is a real, usable dealer website — not blank and not a known marketplace/aggregator page. */
export function isRealDealerWebsite(url: string | null | undefined): boolean {
  if (!url) return false;
  const host = websiteHostname(url);
  return Boolean(host) && !BLOCKED_WEBSITE_DOMAINS.has(host!);
}

export { BLOCKED_WEBSITE_DOMAINS };
