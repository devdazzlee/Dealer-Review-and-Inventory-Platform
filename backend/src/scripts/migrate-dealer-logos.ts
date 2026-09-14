import "dotenv/config";
import { prisma } from "../lib/prisma";
import { backfillDealerLogo } from "../services/dealer-logo.service";

/**
 * Dealer logos aren't Auto.dev-sourced — backfillDealerLogo fetches them
 * fresh from the dealer's own website (or Google's favicon cache) and
 * uploads via image-upload.service.ts, which now stores locally since
 * Cloudinary is dead. backfillDealerLogo no-ops when dealer.logo is already
 * set, so this clears the dead Cloudinary URL first, then lets it re-fetch
 * for real.
 */

const CONCURRENCY = 8;

async function main() {
  const dealers = await prisma.dealer.findMany({
    where: { logo: { contains: "res.cloudinary.com" } },
    select: { id: true, website: true },
  });
  console.log(`${dealers.length} dealers to re-fetch a logo for.`);

  await prisma.dealer.updateMany({
    where: { id: { in: dealers.map((d) => d.id) } },
    data: { logo: null },
  });

  let done = 0;
  let got = 0;
  let skipped = 0;
  const queue = [...dealers];

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    for (;;) {
      const dealer = queue.shift();
      if (!dealer) return;
      try {
        const found = await backfillDealerLogo({ id: dealer.id, website: dealer.website, logo: null });
        if (found) got += 1;
        else skipped += 1;
      } catch (error) {
        skipped += 1;
        console.error(`[migrate-logos] ${dealer.id} failed`, error);
      }
      done += 1;
      if (done % 50 === 0) console.log(`[migrate-logos] ${done}/${dealers.length} processed (got=${got} skipped=${skipped})`);
    }
  });

  await Promise.all(workers);
  console.log(`\nDone. ${done} processed, ${got} got a fresh logo, ${skipped} skipped (no usable website/icon found).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
