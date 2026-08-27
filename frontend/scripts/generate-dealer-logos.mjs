/**
 * Rebuilds the placeholder dealer-logo SVGs (+ contact sheet) from the
 * manifest in public/dealer-logos/_manifest.json.
 *
 * The manifest is the DB-driven list of dealers that had no real logo,
 * written by backend/scripts/backfill-dealer-logo-placeholders.ts. This
 * script exists so the SVG assets can be regenerated without DB access
 * (e.g. after tweaking the shared builder in scripts/lib/dealer-logo-svg.mjs).
 *
 * Run: node scripts/generate-dealer-logos.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildDealerLogoSvg, buildPreviewHtml } from "./lib/dealer-logo-svg.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, "..", "public", "dealer-logos");
const MANIFEST = path.join(OUT_DIR, "_manifest.json");

async function main() {
  let manifest;
  try {
    manifest = JSON.parse(await readFile(MANIFEST, "utf8"));
  } catch {
    console.error(
      `No manifest at ${path.relative(path.join(__dirname, ".."), MANIFEST)}.\n` +
        `Run: cd ../backend && npx tsx scripts/backfill-dealer-logo-placeholders.ts --apply`
    );
    process.exit(1);
  }

  for (const entry of manifest) {
    const svg = buildDealerLogoSvg({ name: entry.name, city: entry.city });
    await writeFile(path.join(OUT_DIR, `${entry.slug}.svg`), svg + "\n");
  }

  await writeFile(path.join(OUT_DIR, "_preview.html"), buildPreviewHtml(manifest));

  console.log(`Rebuilt ${manifest.length} SVGs + _preview.html`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
