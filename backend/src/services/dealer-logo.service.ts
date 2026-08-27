import { load } from "cheerio";
import { prisma } from "../lib/prisma";
import { isRealDealerWebsite, websiteHostname } from "../lib/dealer-website";
import { uploadAdminImage } from "./image-upload.service";

const FETCH_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8",
      },
    });
  } finally {
    clearTimeout(timer);
  }
}

function resolveUrl(base: string, maybeRelative: string): string | null {
  try {
    return new URL(maybeRelative, base).toString();
  } catch {
    return null;
  }
}

/** Finds the best logo-like icon URL referenced in a page's <head>. */
function extractIconUrl(html: string, pageUrl: string): string | null {
  const $ = load(html);
  const candidates: { href: string; priority: number }[] = [];

  $("link[rel]").each((_, el) => {
    const rel = ($(el).attr("rel") || "").toLowerCase();
    const href = $(el).attr("href");
    if (!href) return;

    if (rel.includes("apple-touch-icon")) {
      candidates.push({ href, priority: 0 });
    } else if (rel === "icon" || rel === "shortcut icon") {
      const sizes = $(el).attr("sizes") || "";
      const isSvg = href.toLowerCase().endsWith(".svg");
      const isIco = href.toLowerCase().endsWith(".ico");
      if (isSvg) return; // Cloudinary allow-list doesn't accept SVG.
      if (isIco) {
        candidates.push({ href, priority: 3 });
      } else if (/512|256|192|180|152|144/.test(sizes)) {
        candidates.push({ href, priority: 1 });
      } else {
        candidates.push({ href, priority: 2 });
      }
    }
  });

  if (candidates.length === 0) return null;
  candidates.sort((a, b) => a.priority - b.priority);
  return resolveUrl(pageUrl, candidates[0].href);
}

interface ImageResult {
  buffer: Buffer;
  mimetype: string;
}

async function downloadImage(url: string): Promise<ImageResult | null> {
  const res = await fetchWithTimeout(url, FETCH_TIMEOUT_MS);
  if (!res.ok) return null;

  const contentType = res.headers.get("content-type") || "";
  const mimetype = contentType.split(";")[0].trim().toLowerCase();
  if (!["image/jpeg", "image/png", "image/webp"].includes(mimetype)) {
    return null;
  }

  const arrayBuffer = await res.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  // A legitimate 128px favicon PNG can compress to well under 500 bytes for
  // a simple flat-color icon — only reject truly empty/broken responses.
  if (buffer.length < 100) return null;

  return { buffer, mimetype };
}

/**
 * Google's own public favicon cache — the same source Chrome uses to show
 * a site's icon next to a bookmark. Fetching through here (instead of the
 * dealer's own server) sidesteps bot-protection walls like Akamai, since
 * Google already crawled and cached the icon directly.
 */
async function downloadGoogleFavicon(host: string): Promise<ImageResult | null> {
  const url = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`;
  return downloadImage(url);
}

async function findLogoImage(
  website: string,
  host: string
): Promise<{ image: ImageResult; source: string } | null> {
  let html: string | null = null;
  try {
    const res = await fetchWithTimeout(website, FETCH_TIMEOUT_MS);
    if (res.ok) html = await res.text();
  } catch {
    // dealer's server unreachable/blocked — fall through to Google's cache
  }

  if (html) {
    const iconUrl = extractIconUrl(html, website);
    if (iconUrl) {
      try {
        const image = await downloadImage(iconUrl);
        if (image) return { image, source: iconUrl };
      } catch {
        // fall through to Google's cache
      }
    }
  }

  try {
    const image = await downloadGoogleFavicon(host);
    if (image) return { image, source: `google-favicon-cache:${host}` };
  } catch {
    // no logo available from either source
  }

  return null;
}

/**
 * Finds and uploads a real logo for one dealer from their own website
 * (falling back to Google's cached favicon when the dealer's server blocks
 * automated fetches). No-op if the dealer already has a logo or has no
 * usable (non-marketplace) website on file.
 */
export async function backfillDealerLogo(dealer: {
  id: string;
  website: string | null;
  logo?: string | null;
}): Promise<boolean> {
  if (dealer.logo || !isRealDealerWebsite(dealer.website)) return false;

  const host = websiteHostname(dealer.website!);
  if (!host) return false;

  const found = await findLogoImage(dealer.website!, host);
  if (!found) return false;

  const uploadedUrl = await uploadAdminImage(found.image, "dealer-logos");
  await prisma.dealer.update({
    where: { id: dealer.id },
    data: { logo: uploadedUrl },
  });
  return true;
}
