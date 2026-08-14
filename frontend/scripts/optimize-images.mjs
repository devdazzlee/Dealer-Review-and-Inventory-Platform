/**
 * Converts JPG/JPEG assets in public/ to optimized WebP and updates generated manifests.
 * Run: node scripts/optimize-images.mjs
 */
import { readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PUBLIC_DIRS = ["vehicles", "blog"];
const MAX_WIDTH = 1600;
const WEBP_QUALITY = 82;

const MANIFESTS = [
  path.join(ROOT, "src", "lib", "vehicles", "images.generated.ts"),
  path.join(ROOT, "src", "lib", "blog", "images.generated.ts"),
];

async function convertFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (![".jpg", ".jpeg"].includes(ext)) return null;

  const webpPath = filePath.replace(/\.jpe?g$/i, ".webp");
  const input = await readFile(filePath);
  const before = input.length;

  await sharp(input)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 4 })
    .toFile(webpPath);

  const after = (await readFile(webpPath)).length;
  await unlink(filePath);

  return { webpPath, before, after };
}

async function convertDir(subdir) {
  const dir = path.join(ROOT, "public", subdir);
  let entries;
  try {
    entries = await readdir(dir);
  } catch {
    return { converted: 0, saved: 0 };
  }

  let converted = 0;
  let saved = 0;

  for (const name of entries) {
    if (!/\.jpe?g$/i.test(name)) continue;
    const result = await convertFile(path.join(dir, name));
    if (result) {
      converted += 1;
      saved += result.before - result.after;
      console.log(
        `  ${subdir}/${name} -> ${path.basename(result.webpPath)} (${formatBytes(result.before)} -> ${formatBytes(result.after)})`
      );
    }
  }

  return { converted, saved };
}

function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

async function updateManifests() {
  for (const manifestPath of MANIFESTS) {
    try {
      const content = await readFile(manifestPath, "utf8");
      const updated = content.replace(/\.jpe?g/g, ".webp");
      if (updated !== content) {
        await writeFile(manifestPath, updated);
        console.log(`Updated ${path.relative(ROOT, manifestPath)}`);
      }
    } catch {
      // Manifests are optional; inventory/blog images now come from the API.
    }
  }
}

async function main() {
  console.log("Optimizing public images to WebP...\n");
  let totalConverted = 0;
  let totalSaved = 0;

  for (const subdir of PUBLIC_DIRS) {
    console.log(`${subdir}/`);
    const { converted, saved } = await convertDir(subdir);
    totalConverted += converted;
    totalSaved += saved;
    console.log("");
  }

  await updateManifests();

  console.log(
    `Done. Converted ${totalConverted} files, saved ~${formatBytes(totalSaved)}.`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
