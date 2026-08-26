import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import {
  LOCATION_COOKIE_NAME,
  LOCATION_COOKIE_MAX_AGE_SECONDS,
  serializeUserLocation,
} from "@/lib/location/location-cookie";
import { env } from "@/config/env";

/**
 * Automatic, zero-interaction location detection for first-time visitors who
 * haven't set an explicit location via the location prompt modal — an
 * explicit cookie choice always takes priority over this (this only runs
 * when the cookie is absent).
 *
 * Host-agnostic by design: reads the standard `x-forwarded-for` proxy header
 * (not a platform-specific header) and resolves it via a free external
 * geolocation API, so this doesn't depend on Vercel's edge network or any
 * other specific host. Runs once per visitor — the result is cached in the
 * same cookie the location prompt modal already uses, so this lookup is
 * skipped entirely on every subsequent request.
 */

const BOT_USER_AGENT_PATTERN =
  /bot|crawl|spider|slurp|googlebot|bingbot|duckduckbot|baiduspider|yandexbot|facebookexternalhit|twitterbot|lighthouse|headlesschrome/i;

const PRIVATE_IP_PATTERN =
  /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|fc00:|fe80:)/;

const GEO_LOOKUP_TIMEOUT_MS = 1500;

interface IpWhoIsResponse {
  success: boolean;
  country_code?: string;
  region_code?: string;
  city?: string;
}

/**
 * Local testing only: `x-forwarded-for` never exists on a direct
 * `localhost` request (no proxy sits in front to add it — a VPN doesn't
 * either, since it only changes the apparent IP for real internet
 * traffic, not loopback connections to your own machine's dev server).
 * `?__debug_ip=1.2.3.4` lets you simulate a real visitor's IP in an
 * actual browser instead. Gated on NODE_ENV, which Next.js sets at build
 * time — `next build` always produces "production", so this branch is
 * physically absent from anything actually deployed, not just hidden.
 */
const IS_DEV = process.env.NODE_ENV !== "production";

function extractClientIp(request: NextRequest): string | null {
  if (IS_DEV) {
    const debugIp = request.nextUrl.searchParams.get("__debug_ip");
    if (debugIp) return debugIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for");
  if (!forwardedFor) return null;
  const ip = forwardedFor.split(",")[0]?.trim();
  return ip || null;
}

async function lookupLocationByIp(
  ip: string
): Promise<{ city: string; stateCode: string } | null> {
  try {
    const response = await fetch(`https://ipwho.is/${ip}`, {
      signal: AbortSignal.timeout(GEO_LOOKUP_TIMEOUT_MS),
    });
    if (!response.ok) return null;

    const data = (await response.json()) as IpWhoIsResponse;
    if (
      !data.success ||
      data.country_code !== "US" ||
      !data.region_code ||
      !data.city
    ) {
      return null;
    }

    return { city: data.city, stateCode: data.region_code };
  } catch {
    // Network failure, timeout, or rate limit — degrade to no
    // personalization rather than blocking or failing the page request.
    return null;
  }
}

/** Fire-and-forget: logs one row so the admin "where visitors come from"
 * tab has something to show. Never awaited by the caller — a slow or
 * failed call here must never delay or break the visitor's page load. */
function trackVisit(
  location: { city: string; stateCode: string },
  path: string
): Promise<void> {
  return fetch(`${env.apiBaseUrl}/api/visits/track`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      city: location.city,
      stateCode: location.stateCode,
      path,
    }),
  })
    .then(() => undefined)
    .catch(() => undefined);
}

export async function middleware(request: NextRequest, event: NextFetchEvent) {
  if (request.cookies.has(LOCATION_COOKIE_NAME)) {
    return NextResponse.next();
  }

  const userAgent = request.headers.get("user-agent") ?? "";
  if (BOT_USER_AGENT_PATTERN.test(userAgent)) {
    return NextResponse.next();
  }

  const ip = extractClientIp(request);
  if (!ip || PRIVATE_IP_PATTERN.test(ip)) {
    return NextResponse.next();
  }

  const location = await lookupLocationByIp(ip);
  const response = NextResponse.next();

  if (location) {
    response.cookies.set(
      LOCATION_COOKIE_NAME,
      serializeUserLocation({ ...location, source: "geolocation" }),
      {
        maxAge: LOCATION_COOKIE_MAX_AGE_SECONDS,
        path: "/",
        sameSite: "lax",
      }
    );
    event.waitUntil(trackVisit(location, request.nextUrl.pathname));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api/|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?)$).*)",
  ],
};
