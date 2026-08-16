/**
 * Quick smoke test for the Zembra "Find Listing" API — checking whether it
 * can locate the Bergen Car Company profile and return a rating/review
 * count without us having to scrape Carfax directly.
 *
 * Reads ZEMBRA_API_TOKEN from .env (never hardcode the token in source).
 *
 * Usage: npx tsx src/scripts/test-zembra.ts
 */

import "dotenv/config";

const TOKEN = process.env.ZEMBRA_API_TOKEN;
const QUERY = "Bergen Car Company";
const LOCATION = "Paramus, NJ, 07652";

async function main() {
  if (!TOKEN) {
    console.error("Missing ZEMBRA_API_TOKEN in backend/.env");
    process.exit(1);
  }

  const url = new URL("https://api.zembra.io/listing/find");
  url.searchParams.set("query", QUERY);
  url.searchParams.set("location", LOCATION);

  console.log("=== Zembra Find Listing Test ===");
  console.log("URL:", url.toString());
  console.log("");

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${TOKEN}`,
    },
  });

  console.log("HTTP status:", res.status);

  const text = await res.text();
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    body = text;
  }

  console.log("Response body:");
  console.log(JSON.stringify(body, null, 2));

  // If results came back, try to surface anything Carfax-flavored specifically.
  if (
    body &&
    typeof body === "object" &&
    Array.isArray((body as any).data ?? (body as any).results)
  ) {
    const list = (body as any).data ?? (body as any).results;
    const carfaxLike = list.filter((item: any) =>
      JSON.stringify(item).toLowerCase().includes("carfax")
    );
    console.log("");
    console.log("Carfax-flavored matches:", carfaxLike.length);
    if (carfaxLike.length) console.log(JSON.stringify(carfaxLike, null, 2));
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
