import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { isRealDealerWebsite } from "../src/lib/dealer-website";
import { backfillDealerLogo } from "../src/services/dealer-logo.service";

const CONCURRENCY = 5;
const LIMIT_ARG = process.argv.find((a) => a.startsWith("--limit="));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split("=")[1], 10) : undefined;

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>
) {
  let index = 0;
  async function next(): Promise<void> {
    const i = index++;
    if (i >= items.length) return;
    await worker(items[i]);
    return next();
  }
  await Promise.all(Array.from({ length: limit }, () => next()));
}

/**
 * One-off sweep over every dealer that already has a usable website but no
 * logo yet. The recurring pattern (cron-driven Place ID lookup discovering
 * a real website and immediately backfilling the logo) is in
 * google-place-lookup.service.ts; this script exists to catch dealers that
 * already had a real website on file before that wiring existed, or to
 * re-run after fixing a batch of dealer.website values by hand.
 */
async function main() {
  const dealers = await prisma.dealer.findMany({
    where: { website: { not: null }, logo: null },
    select: { id: true, name: true, website: true },
    take: LIMIT,
  });

  const candidates = dealers.filter((d) => isRealDealerWebsite(d.website));
  console.log(
    `${dealers.length} dealers have a website and no logo; ${candidates.length} are on a real (non-marketplace) domain.`
  );

  let uploaded = 0;
  let skipped = 0;
  let done = 0;

  await runWithConcurrency(candidates, CONCURRENCY, async (dealer) => {
    try {
      const added = await backfillDealerLogo(dealer);
      if (added) {
        uploaded += 1;
        console.log(`✓ ${dealer.name} (${dealer.website})`);
      } else {
        skipped += 1;
      }
    } catch (err) {
      skipped += 1;
      console.error(`✗ ${dealer.name}: ${(err as Error).message}`);
    }
    done += 1;
    if (done % 50 === 0) console.log(`... ${done}/${candidates.length} processed`);
  });

  console.log(`\nDone. Uploaded: ${uploaded}, no logo found: ${skipped}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
