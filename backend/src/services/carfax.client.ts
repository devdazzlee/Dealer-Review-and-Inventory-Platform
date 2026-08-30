import * as cheerio from "cheerio";
import { env } from "../config/env";
import { HttpError } from "../lib/http";
import { generateSlug } from "../utils/slug";

/**
 * Direct-fetch scraper for a Carfax dealer page's aggregate rating.
 *
 * Carfax has no public API for third-party rating access (their partner API is
 * dealer-account gated — see the chat history), so this reads the public dealer
 * page HTML the same way Google's crawler does: it pulls the schema.org
 * `AggregateRating` that Carfax itself embeds for rich snippets.
 *
 * Carfax fronts these pages with CloudFront + bot detection and returns a 403
 * challenge to obvious bots. This client does what it can without a paid
 * unblocking service — realistic browser headers, a primed cookie jar, a
 * referer chain, slow pacing — and surfaces a blocked response as a distinct
 * error so the caller can back off instead of treating it as "no rating".
 */

const CARFAX_ORIGIN = "https://www.carfax.com";

/** Rotated per request — a single static UA is the easiest bot tell. */
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
];

/** Text/markup fingerprints of a CloudFront / Akamai / PerimeterX block page. */
const BLOCK_SIGNATURES = [
  "the request could not be satisfied",
  "pardon our interruption",
  "access denied",
  "request blocked",
  "you have been blocked",
  "px-captcha",
  "/_incapsula_",
  "distil_r_captcha",
  "please verify you are a human",
  "captcha-delivery.com",
];

/** Carfax soft-404 / unclaimed-page fingerprints (page loads 200 but has no dealer). */
const NOT_FOUND_SIGNATURES = [
  "we couldn't find that page",
  "we can't find the page",
  "page not found",
  "sorry, we couldn't find",
];

export class CarfaxBlockedError extends HttpError {
  constructor(message: string, status = 403) {
    super(message, status);
    this.name = "CarfaxBlockedError";
  }
}

export interface CarfaxRatingResult {
  /** The URL that was actually scraped (after redirects). */
  url: string;
  /** 0–5, one decimal place. null when the page had no aggregate rating. */
  rating: number | null;
  /** Review count backing the rating, when the page exposes it. */
  reviewCount: number | null;
  /** Business name as it appears on the Carfax page — used for a match guard. */
  businessName: string | null;
  /**
   * false when the page resolved but is not a real rated dealer page
   * (soft-404, unclaimed profile, redirect back to the dealer index).
   */
  valid: boolean;
}

export function isCarfaxConfigured(): boolean {
  return env.carfax.lookupEnabled;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Build the canonical Carfax dealer page URL from a dealer record. Carfax's
 * slug is `{name}-{city}-{state}-{zip}` lowercased with punctuation stripped —
 * e.g. "Bergen Car Company" / Paramus / NJ / 07652 →
 * carfax.com/dealers/bergen-car-company-paramus-nj-07652
 */
export function buildCarfaxDealerUrl(dealer: {
  name: string;
  city: string;
  state: string;
  zip: string;
}): string {
  const slug = generateSlug(
    `${dealer.name} ${dealer.city} ${dealer.state} ${dealer.zip}`.trim()
  );
  return `${CARFAX_ORIGIN}/dealers/${slug}`;
}

// --- cookie jar (module-scoped, primed once per process) --------------------

let cookieJar = "";
let primedAt = 0;
/** Re-prime the jar every 30 min — Akamai session cookies rotate. */
const PRIME_TTL_MS = 30 * 60 * 1000;

function mergeSetCookies(response: Response): void {
  // Node 18.14+/20 undici exposes getSetCookie(); fall back to the folded header.
  const raw =
    typeof (response.headers as any).getSetCookie === "function"
      ? (response.headers as any).getSetCookie()
      : response.headers.get("set-cookie")
        ? [response.headers.get("set-cookie") as string]
        : [];
  if (raw.length === 0) return;

  const jar = new Map<string, string>();
  for (const pair of cookieJar.split("; ").filter(Boolean)) {
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq), pair.slice(eq + 1));
  }
  for (const line of raw) {
    const first = line.split(";")[0];
    const eq = first.indexOf("=");
    if (eq > 0) jar.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim());
  }
  cookieJar = Array.from(jar, ([k, v]) => `${k}=${v}`).join("; ");
}

function baseHeaders(userAgent: string): Record<string, string> {
  return {
    "User-Agent": userAgent,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Ch-Ua": '"Not/A)Brand";v="8", "Chromium";v="127", "Google Chrome";v="127"',
    "Sec-Ch-Ua-Mobile": "?0",
    "Sec-Ch-Ua-Platform": '"Windows"',
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
  };
}

async function primeCookies(userAgent: string): Promise<void> {
  if (cookieJar && Date.now() - primedAt < PRIME_TTL_MS) return;
  try {
    const res = await fetch(`${CARFAX_ORIGIN}/`, {
      headers: baseHeaders(userAgent),
      redirect: "follow",
    });
    mergeSetCookies(res);
    // Drain the body so the socket is released.
    await res.text().catch(() => "");
    primedAt = Date.now();
  } catch {
    // A failed prime isn't fatal — the dealer request may still succeed.
  }
}

function looksBlocked(status: number, html: string): boolean {
  if (status === 403 || status === 429 || status === 503) return true;
  const lower = html.slice(0, 4000).toLowerCase();
  return BLOCK_SIGNATURES.some((sig) => lower.includes(sig));
}

function looksNotFound(finalUrl: string, html: string): boolean {
  if (!/\/dealers\/[^/?#]+/.test(finalUrl)) return true; // redirected off the dealer page
  const lower = html.toLowerCase();
  return NOT_FOUND_SIGNATURES.some((sig) => lower.includes(sig));
}

// --- fetch + parse ---------------------------------------------------------

interface FetchResult {
  html: string;
  finalUrl: string;
  status: number;
}

async function fetchDealerPage(url: string): Promise<FetchResult> {
  const userAgent = pick(USER_AGENTS);
  await primeCookies(userAgent);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25_000);
  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        ...baseHeaders(userAgent),
        Referer: `${CARFAX_ORIGIN}/`,
        "Sec-Fetch-Site": "same-origin",
        ...(cookieJar ? { Cookie: cookieJar } : {}),
      },
      redirect: "follow",
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }

  mergeSetCookies(response);
  const html = await response.text().catch(() => "");
  const finalUrl = response.url || url;

  if (looksBlocked(response.status, html)) {
    // Wipe the jar so the next attempt re-primes from scratch.
    cookieJar = "";
    primedAt = 0;
    throw new CarfaxBlockedError(
      `Carfax blocked the request for ${url} (HTTP ${response.status})`,
      response.status === 200 ? 403 : response.status
    );
  }

  // Transient server error — surface it as a plain failure (retried next run)
  // rather than letting an empty body get stamped as "checked, no rating".
  if (response.status >= 500) {
    throw new HttpError(
      `Carfax returned HTTP ${response.status} for ${url}`,
      response.status
    );
  }

  return { html, finalUrl, status: response.status };
}

function toRating(value: unknown): number | null {
  const n = typeof value === "string" ? parseFloat(value) : (value as number);
  if (typeof n !== "number" || !Number.isFinite(n)) return null;
  if (n <= 0 || n > 5) return null;
  return Math.round(n * 10) / 10;
}

function toCount(value: unknown): number | null {
  const n =
    typeof value === "string"
      ? parseInt(value.replace(/[^0-9]/g, ""), 10)
      : (value as number);
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
  return Math.trunc(n);
}

/** Recursively collect every object node from a JSON-LD payload (handles @graph + arrays). */
function flattenJsonLd(node: unknown, out: Record<string, unknown>[]): void {
  if (Array.isArray(node)) {
    for (const item of node) flattenJsonLd(item, out);
    return;
  }
  if (node && typeof node === "object") {
    const obj = node as Record<string, unknown>;
    out.push(obj);
    if (obj["@graph"]) flattenJsonLd(obj["@graph"], out);
  }
}

interface ParsedRating {
  rating: number | null;
  reviewCount: number | null;
  businessName: string | null;
}

export function parseCarfaxRating(html: string): ParsedRating {
  const $ = cheerio.load(html);
  let rating: number | null = null;
  let reviewCount: number | null = null;
  let businessName: string | null = null;

  // 1. schema.org JSON-LD AggregateRating — Carfax embeds this for rich snippets.
  $('script[type="application/ld+json"]').each((_, el) => {
    if (rating != null) return;
    const text = $(el).contents().text().trim();
    if (!text) return;
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      return;
    }
    const nodes: Record<string, unknown>[] = [];
    flattenJsonLd(data, nodes);
    for (const node of nodes) {
      const agg = node["aggregateRating"] as Record<string, unknown> | undefined;
      if (agg && typeof agg === "object") {
        rating = toRating(agg["ratingValue"]);
        reviewCount =
          toCount(agg["reviewCount"]) ?? toCount(agg["ratingCount"]);
        if (typeof node["name"] === "string") businessName = node["name"] as string;
        if (rating != null) break;
      }
    }
  });

  // 2. Next.js / Redux hydration blob.
  if (rating == null) {
    const nextData = $("#__NEXT_DATA__").contents().text().trim();
    const blobs = [nextData].filter(Boolean);
    for (const blob of blobs) {
      try {
        const json = JSON.parse(blob);
        const hit = deepFindRating(json);
        if (hit.rating != null) {
          rating = hit.rating;
          reviewCount = reviewCount ?? hit.reviewCount;
          businessName = businessName ?? hit.businessName;
          break;
        }
      } catch {
        /* fall through to regex */
      }
    }
  }

  // 3. Last-ditch regex over the raw markup.
  if (rating == null) {
    const rx = html.match(
      /"(?:ratingValue|averageRating|overallRating|dealerRating|starRating)"\s*:\s*"?(\d(?:\.\d+)?)"?/i
    );
    if (rx) rating = toRating(rx[1]);
    const cx = html.match(
      /"(?:reviewCount|ratingCount|totalReviewCount|reviewsCount|numberOfReviews)"\s*:\s*"?(\d[\d,]*)"?/i
    );
    if (cx) reviewCount = reviewCount ?? toCount(cx[1]);
  }

  // Business-name fallbacks for the caller's match guard.
  if (!businessName) {
    const h1 = $("h1").first().text().trim();
    if (h1) businessName = h1;
  }
  if (!businessName) {
    const title = $("title").first().text().trim();
    if (title) businessName = title.split(/[|\-–—]/)[0].trim();
  }

  return { rating, reviewCount, businessName: businessName || null };
}

/** Depth-limited search for a rating/reviewCount/name triple inside an arbitrary object. */
function deepFindRating(
  root: unknown,
  depth = 0
): ParsedRating {
  const result: ParsedRating = { rating: null, reviewCount: null, businessName: null };
  if (depth > 8 || !root || typeof root !== "object") return result;

  const ratingKeys = [
    "ratingValue",
    "averageRating",
    "overallRating",
    "dealerRating",
    "starRating",
    "rating",
  ];
  const countKeys = [
    "reviewCount",
    "ratingCount",
    "totalReviewCount",
    "reviewsCount",
    "numberOfReviews",
    "numReviews",
  ];
  const nameKeys = ["name", "displayName", "dealerName", "businessName"];

  const stack: unknown[] = [root];
  let guard = 0;
  while (stack.length && guard < 5000) {
    guard += 1;
    const cur = stack.pop();
    if (!cur || typeof cur !== "object") continue;

    if (Array.isArray(cur)) {
      for (const item of cur) if (item && typeof item === "object") stack.push(item);
      continue;
    }

    const obj = cur as Record<string, unknown>;
    if (result.rating == null) {
      for (const k of ratingKeys) {
        if (k in obj) {
          const r = toRating(obj[k]);
          if (r != null) {
            result.rating = r;
            for (const ck of countKeys) {
              if (ck in obj) {
                result.reviewCount = result.reviewCount ?? toCount(obj[ck]);
              }
            }
            for (const nk of nameKeys) {
              if (typeof obj[nk] === "string") {
                result.businessName = result.businessName ?? (obj[nk] as string);
              }
            }
            break;
          }
        }
      }
    }
    for (const v of Object.values(obj)) {
      if (v && typeof v === "object") stack.push(v);
    }
  }
  return result;
}

/**
 * Scrape one Carfax dealer page. Throws {@link CarfaxBlockedError} when Carfax
 * serves a bot challenge (caller should back off); returns `valid: false` when
 * the page loads but isn't a real rated dealer page.
 */
export async function fetchCarfaxRating(url: string): Promise<CarfaxRatingResult> {
  const { html, finalUrl } = await fetchDealerPage(url);

  if (looksNotFound(finalUrl, html)) {
    return { url: finalUrl, rating: null, reviewCount: null, businessName: null, valid: false };
  }

  const parsed = parseCarfaxRating(html);
  return {
    url: finalUrl,
    rating: parsed.rating,
    reviewCount: parsed.reviewCount,
    businessName: parsed.businessName,
    valid: parsed.rating != null,
  };
}
