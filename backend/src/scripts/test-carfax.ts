/**
 * Feasibility test: can a Carfax dealer page be scraped with a plain
 * headless Playwright/Chromium session (no proxy, no paid unblocking
 * service)?
 *
 * Usage: npx tsx src/scripts/test-carfax.ts
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import path from "path";

const TARGET_URL =
  "https://www.carfax.com/dealers/bergen-car-company-paramus-nj-07652";

const OUT_DIR = path.join(__dirname, "..", "..", "tmp", "carfax-test");

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const userAgent = pick(USER_AGENTS);
  const viewport = { width: 1366, height: 768 };

  console.log("=== Carfax Scrape Feasibility Test ===");
  console.log("Target URL:", TARGET_URL);
  console.log("User-Agent:", userAgent);
  console.log("Viewport:", viewport);
  console.log("");

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  const context = await browser.newContext({
    userAgent,
    viewport,
    locale: "en-US",
    timezoneId: "America/New_York",
    extraHTTPHeaders: {
      "Accept-Language": "en-US,en;q=0.9",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
    },
  });

  // Remove the navigator.webdriver flag and a few other common headless tells
  // before any page script runs.
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    // @ts-ignore
    window.chrome = { runtime: {} };
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
    Object.defineProperty(navigator, "plugins", {
      get: () => [1, 2, 3, 4, 5],
    });
  });

  const page = await context.newPage();

  let httpStatus: number | null = null;
  let finalUrl = "";
  let navError: string | null = null;

  page.on("response", (response) => {
    if (response.url() === TARGET_URL || httpStatus === null) {
      if (response.request().resourceType() === "document") {
        httpStatus = response.status();
      }
    }
  });

  try {
    const response = await page.goto(TARGET_URL, {
      waitUntil: "domcontentloaded",
      timeout: 45000,
    });
    if (response) httpStatus = response.status();
    finalUrl = page.url();

    // Give any JS challenge (Akamai/Cloudflare) a moment to resolve or render
    await page.waitForTimeout(5000);
  } catch (err: any) {
    navError = err?.message ?? String(err);
    console.error("Navigation error:", navError);
  }

  const html = await page.content().catch(() => "");
  const title = await page.title().catch(() => "");

  // --- Akamai / bot-challenge detection ---
  const akamaiSignals = [
    "_abck",
    "ak_bmsc",
    "bm_sz",
    "Akamai",
    "challenge-container",
    "Pardon Our Interruption",
    "Reference #",
    "Access Denied",
    "px-captcha",
    "distil_r_captcha",
  ];
  const cookies = await context.cookies();
  const cookieNames = cookies.map((c) => c.name);
  const foundAkamaiCookies = cookieNames.filter((n) =>
    ["_abck", "ak_bmsc", "bm_sz", "bm_mi", "bm_sv"].includes(n)
  );
  const bodyTextLower = html.toLowerCase();
  const foundAkamaiTextSignals = akamaiSignals.filter((sig) =>
    bodyTextLower.includes(sig.toLowerCase())
  );
  const akamaiChallengeDetected =
    foundAkamaiCookies.length > 0 || foundAkamaiTextSignals.length > 0;

  // --- Attempt to extract rating / review count ---
  const extraction = await page.evaluate(() => {
    const results: Record<string, string | null> = {
      ratingTextGuess: null,
      reviewCountTextGuess: null,
      jsonLdRating: null,
      jsonLdReviewCount: null,
    };

    // 1. Look for schema.org JSON-LD AggregateRating
    const ldScripts = Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    );
    for (const script of ldScripts) {
      try {
        const data = JSON.parse(script.textContent || "{}");
        const nodes = Array.isArray(data) ? data : [data];
        for (const node of nodes) {
          const agg = node?.aggregateRating;
          if (agg) {
            results.jsonLdRating = String(agg.ratingValue ?? "");
            results.jsonLdReviewCount = String(agg.reviewCount ?? agg.ratingCount ?? "");
          }
        }
      } catch {
        /* ignore parse errors */
      }
    }

    // 2. Heuristic text scan for rating-looking content
    const bodyText = document.body?.innerText || "";
    const ratingMatch = bodyText.match(/(\d(?:\.\d)?)\s*(?:out of 5|\/\s*5|stars)/i);
    if (ratingMatch) results.ratingTextGuess = ratingMatch[0];

    const reviewCountMatch = bodyText.match(/([\d,]+)\s*reviews?/i);
    if (reviewCountMatch) results.reviewCountTextGuess = reviewCountMatch[0];

    return results;
  });

  const screenshotPath = path.join(OUT_DIR, "carfax-rendered.png");
  await page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => {});

  const htmlPath = path.join(OUT_DIR, "carfax-page.html");
  writeFileSync(htmlPath, html, "utf-8");

  await browser.close();

  // --- Report ---
  console.log("--- RESULTS ---");
  console.log("Navigation error:", navError ?? "none");
  console.log("Final URL:", finalUrl);
  console.log("HTTP status:", httpStatus);
  console.log("Page title:", title);
  console.log("");
  console.log("Akamai cookies found:", foundAkamaiCookies);
  console.log("Akamai text signals found:", foundAkamaiTextSignals);
  console.log("Akamai challenge detected:", akamaiChallengeDetected);
  console.log("");
  console.log("JSON-LD rating:", extraction.jsonLdRating);
  console.log("JSON-LD review count:", extraction.jsonLdReviewCount);
  console.log("Heuristic rating text match:", extraction.ratingTextGuess);
  console.log("Heuristic review count text match:", extraction.reviewCountTextGuess);
  console.log("");
  console.log("HTML length (chars):", html.length);
  console.log("HTML saved to:", htmlPath);
  console.log("Screenshot saved to:", screenshotPath);
}

main().catch((err) => {
  console.error("Fatal error running test:", err);
  process.exit(1);
});
