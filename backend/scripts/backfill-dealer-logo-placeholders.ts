import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { prisma } from "../src/lib/prisma";
// Shared, dependency-free SVG builder (also used by the frontend asset script).
import {
  buildDealerLogoSvg,
  buildPreviewHtml,
} from "../../frontend/scripts/lib/dealer-logo-svg.mjs";

/**
 * Gives every dealer that has no real logo an honest generated placeholder
 * (a colored crest with the dealer's initials — see DealerAvatar.tsx), so
 * the dealer list / profile hero never falls back to a bare initials box.
 *
 * For each logo-less dealer it writes
 *   frontend/public/dealer-logos/<dealer.slug>.svg
 * and sets dealer.logo = "<base>/<dealer.slug>.svg" (default base
 * "/dealer-logos", served straight from the Next public/ dir).
 *
 * Safe by default: with no flag it only reports. Pass --files-only to write
 * the SVG assets without touching the DB, or --apply to also set dealer.logo
 * (never overwrites a logo that's already set).
 *
 * Usage:
 *   npx tsx scripts/backfill-dealer-logo-placeholders.ts            # dry run
 *   npx tsx scripts/backfill-dealer-logo-placeholders.ts --files-only
 *   npx tsx scripts/backfill-dealer-logo-placeholders.ts --apply
 *   npx tsx scripts/backfill-dealer-logo-placeholders.ts --apply --base=/dealer-logos
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(
  __dirname,
  "..",
  "..",
  "frontend",
  "public",
  "dealer-logos"
);

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const FILES_ONLY = args.includes("--files-only");
const WRITE_FILES = APPLY || FILES_ONLY;
const baseArg = args.find((a) => a.startsWith("--base="));
const BASE = (baseArg ? baseArg.split("=")[1] : "/dealer-logos").replace(
  /\/$/,
  ""
);

async function main() {
  const dealers = await prisma.dealer.findMany({
    // Every dealer that either still needs a placeholder, or already has one
    // — so a re-run always regenerates the full asset set + manifest, not
    // just whatever's left un-backfilled.
    where: {
      OR: [{ logo: null }, { logo: "" }, { logo: { startsWith: `${BASE}/` } }],
    },
    select: { id: true, slug: true, name: true, city: true, state: true, logo: true },
    orderBy: [{ state: "asc" }, { name: "asc" }],
  });

  const needsLogo = dealers.filter((d) => !d.logo);
  console.log(
    `${dealers.length} dealers in the placeholder set (${needsLogo.length} still need dealer.logo set).` +
      (WRITE_FILES ? "" : "  (dry run — pass --files-only or --apply to write)")
  );

  const slugs = new Set<string>();
  const manifest: {
    id: string;
    slug: string;
    name: string;
    city: string;
    state: string;
    needsLogo: boolean;
  }[] = [];

  for (const d of dealers) {
    if (slugs.has(d.slug)) {
      throw new Error(`Duplicate dealer.slug "${d.slug}" — aborting.`);
    }
    slugs.add(d.slug);
    manifest.push({
      id: d.id,
      slug: d.slug,
      name: d.name,
      city: d.city,
      state: d.state,
      needsLogo: !d.logo,
    });
  }

  if (!WRITE_FILES) {
    for (const m of manifest) {
      console.log(
        `  ${m.state}  ${m.slug}.svg  <- ${m.name} (${m.city})${m.needsLogo ? "  [needs logo]" : ""}`
      );
    }
    console.log(
      `\nWould write ${manifest.length} SVGs to ${path.relative(
        path.join(__dirname, "..", ".."),
        OUT_DIR
      )}/ and set dealer.logo = "${BASE}/<slug>.svg" for ${needsLogo.length}.`
    );
    await prisma.$disconnect();
    return;
  }

  await mkdir(OUT_DIR, { recursive: true });

  let filesWritten = 0;
  for (const m of manifest) {
    const svg = buildDealerLogoSvg({ name: m.name, city: m.city });
    await writeFile(path.join(OUT_DIR, `${m.slug}.svg`), svg + "\n");
    filesWritten += 1;
  }
  await writeFile(
    path.join(OUT_DIR, "_manifest.json"),
    JSON.stringify(
      manifest.map(({ id, needsLogo, ...rest }) => rest),
      null,
      2
    ) + "\n"
  );
  await writeFile(path.join(OUT_DIR, "_preview.html"), buildPreviewHtml(manifest));
  console.log(`Wrote ${filesWritten} SVGs + _manifest.json + _preview.html`);

  if (!APPLY) {
    console.log("\n--files-only: DB not touched.");
    await prisma.$disconnect();
    return;
  }

  const pending = manifest.filter((m) => m.needsLogo);
  let updated = 0;
  let skipped = 0;
  const CONCURRENCY = 16;
  for (let i = 0; i < pending.length; i += CONCURRENCY) {
    const batch = pending.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map((m) =>
        // updateMany with the guard so a logo set since the initial query is
        // never clobbered.
        prisma.dealer.updateMany({
          where: { id: m.id, OR: [{ logo: null }, { logo: "" }] },
          data: { logo: `${BASE}/${m.slug}.svg` },
        })
      )
    );
    for (const res of results) {
      if (res.count > 0) updated += 1;
      else skipped += 1;
    }
  }

  console.log(
    `\nDone. dealer.logo set for ${updated} dealers` +
      (skipped ? `, ${skipped} skipped (already had a logo)` : "") +
      `.`
  );
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
