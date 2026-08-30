/**
 * End-to-end check for the Carfax rating scraper (src/services/carfax.client.ts).
 *
 * Fetches a live Carfax dealer page with the same direct-fetch path the nightly
 * carfax-lookup job uses and prints the parsed rating, so you can see whether
 * Carfax is currently letting server requests through and whether the parser
 * still lines up with their markup.
 *
 * Usage:
 *   npx tsx src/scripts/test-carfax.ts
 *   npx tsx src/scripts/test-carfax.ts "https://www.carfax.com/dealers/<slug>"
 *   npx tsx src/scripts/test-carfax.ts "Bergen Car Company" Paramus NJ 07652
 */

import "dotenv/config";
import {
  buildCarfaxDealerUrl,
  fetchCarfaxRating,
  parseCarfaxRating,
  CarfaxBlockedError,
} from "../services/carfax.client";

function resolveTarget(argv: string[]): string {
  if (argv.length === 0) {
    return buildCarfaxDealerUrl({
      name: "Bergen Car Company",
      city: "Paramus",
      state: "NJ",
      zip: "07652",
    });
  }
  if (argv.length === 1 && /^https?:\/\//i.test(argv[0])) return argv[0];
  const [name, city, state, zip] = argv;
  return buildCarfaxDealerUrl({
    name,
    city: city ?? "",
    state: state ?? "",
    zip: zip ?? "",
  });
}

async function main() {
  const url = resolveTarget(process.argv.slice(2));

  console.log("=== Carfax Scraper Test ===");
  console.log("Target URL:", url);
  console.log("");

  try {
    const result = await fetchCarfaxRating(url);
    console.log("--- RESULT ---");
    console.log("Resolved URL :", result.url);
    console.log("Business name:", result.businessName ?? "(none parsed)");
    console.log("Rating       :", result.rating ?? "(none)");
    console.log("Review count :", result.reviewCount ?? "(none)");
    console.log("Valid        :", result.valid);
    if (!result.valid) {
      console.log("");
      console.log(
        "No aggregate rating on the page — either the slug is wrong, the dealer"
      );
      console.log("has no Carfax profile, or Carfax served a soft-404.");
    }
  } catch (err) {
    if (err instanceof CarfaxBlockedError) {
      console.error("BLOCKED:", err.message);
      console.error(
        "Carfax served a bot challenge. Direct-fetch scraping is being refused" +
          " right now; a proxy / rendering service would be needed for reliability."
      );
      process.exitCode = 2;
      return;
    }
    throw err;
  }
}

// Exported so this file also doubles as a quick parser check against saved HTML.
export { parseCarfaxRating };

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
