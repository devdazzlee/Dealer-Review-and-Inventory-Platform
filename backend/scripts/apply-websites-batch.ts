import "dotenv/config";
import fs from "fs";
import { prisma } from "../src/lib/prisma";
import { isRealDealerWebsite } from "../src/lib/dealer-website";
import { backfillDealerLogo } from "../src/services/dealer-logo.service";

/**
 * Applies a batch of web-search-discovered dealer websites (id, website
 * pairs, JSON array) — each verified by a research pass before being
 * handed to this script. Never overwrites a website that's already real;
 * only fills in dealers whose current value is missing or a marketplace
 * placeholder. Then immediately tries to backfill that dealer's logo from
 * the newly-set website.
 *
 * Usage: tsx scripts/apply-websites-batch.ts path/to/batch.json
 */
async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: tsx scripts/apply-websites-batch.ts <path-to-json>");
    process.exit(1);
  }

  const entries = JSON.parse(fs.readFileSync(filePath, "utf-8")) as {
    id: string;
    website: string;
  }[];

  console.log(`Applying ${entries.length} website entries...`);

  let websitesUpdated = 0;
  let skippedAlreadyReal = 0;
  let logosAdded = 0;
  let notFound = 0;

  for (const entry of entries) {
    const dealer = await prisma.dealer.findUnique({
      where: { id: entry.id },
      select: { id: true, name: true, website: true, logo: true },
    });

    if (!dealer) {
      notFound += 1;
      console.warn(`✗ dealer not found: ${entry.id}`);
      continue;
    }

    if (isRealDealerWebsite(dealer.website)) {
      skippedAlreadyReal += 1;
      continue;
    }

    await prisma.dealer.update({
      where: { id: dealer.id },
      data: { website: entry.website },
    });
    websitesUpdated += 1;

    try {
      const added = await backfillDealerLogo({
        id: dealer.id,
        website: entry.website,
        logo: dealer.logo,
      });
      if (added) {
        logosAdded += 1;
        console.log(`✓ ${dealer.name} -> ${entry.website}`);
      } else {
        console.log(`  ${dealer.name}: website set, no logo found`);
      }
    } catch (err) {
      console.error(`  ${dealer.name}: logo backfill error — ${(err as Error).message}`);
    }
  }

  console.log(
    `\nDone. Websites updated: ${websitesUpdated}, already real (skipped): ${skippedAlreadyReal}, logos added: ${logosAdded}, not found: ${notFound}`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
