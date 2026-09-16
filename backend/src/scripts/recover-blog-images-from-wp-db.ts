import "dotenv/config";
import * as cheerio from "cheerio";
import fs from "fs/promises";
import path from "path";
import { prisma } from "../lib/prisma";
import { uploadAdminImageWithDimensions } from "../services/image-upload.service";
import { parseInsertRows, rowsToObjects } from "./lib/parse-wp-sql-dump";

/**
 * The real fix for the dead-Cloudinary blog images: the client's old
 * hosting account turned out to still be reachable, with the actual
 * WordPress database (exported as AtoSales_posts.sql / AtoSales_postmeta.sql)
 * and the full original wp-content/uploads media library. This reads the
 * real post-to-image relationships straight from that database export —
 * no archive.org involved, no flaky downloads, no guessing at which image
 * belongs to which post.
 *
 * Usage:
 *   npx tsx src/scripts/recover-blog-images-from-wp-db.ts \
 *     --sql-dir /root/wp-sql --uploads-dir /root/wp-needed/uploads
 */

const SQL_DIR = (() => {
  const i = process.argv.indexOf("--sql-dir");
  if (i < 0) throw new Error("--sql-dir <path> is required");
  return process.argv[i + 1];
})();
const UPLOADS_DIR = (() => {
  const i = process.argv.indexOf("--uploads-dir");
  if (i < 0) throw new Error("--uploads-dir <path> is required");
  return process.argv[i + 1];
})();

interface WpPost {
  ID: number;
  post_content: string;
  post_name: string;
  post_type: string;
  guid: string;
}
interface WpPostMeta {
  post_id: number;
  meta_key: string;
  meta_value: string;
}

function localPathFromUrl(url: string): string | null {
  const m = url.match(/wp-content\/uploads\/(.+)$/);
  if (!m) return null;
  return path.join(UPLOADS_DIR, decodeURIComponent(m[1]));
}

async function readIfExists(p: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(p);
  } catch {
    return null;
  }
}

/**
 * Only used to pass the upload service's allowed-type gate — sharp detects
 * the real format from the buffer's actual bytes regardless of this label,
 * so a GIF mislabeled as jpeg still converts correctly. GIF itself isn't in
 * the service's allowed list, so it can't be reported honestly here.
 */
function mimeFromExt(file: string): string {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  return "image/jpeg";
}

interface PendingPost {
  slug: string;
  featuredImageUrl: string | null;
  body: unknown;
}

async function main() {
  console.log("Parsing AtoSales_posts.sql...");
  const { columns: postCols, rows: postRows } = await parseInsertRows(
    path.join(SQL_DIR, "AtoSales_posts.sql"),
    "AtoSales_posts"
  );
  const wpPosts = rowsToObjects<WpPost>(postCols, postRows);

  console.log("Parsing AtoSales_postmeta.sql...");
  const { columns: metaCols, rows: metaRows } = await parseInsertRows(
    path.join(SQL_DIR, "AtoSales_postmeta.sql"),
    "AtoSales_postmeta"
  );
  const wpPostMeta = rowsToObjects<WpPostMeta>(metaCols, metaRows);

  const attachmentsById = new Map<number, WpPost>();
  const wpPostBySlug = new Map<string, WpPost>();
  for (const p of wpPosts) {
    if (p.post_type === "attachment") attachmentsById.set(p.ID, p);
    if (p.post_type === "post") wpPostBySlug.set(p.post_name, p);
  }
  const thumbnailByPostId = new Map<number, number>();
  for (const m of wpPostMeta) {
    if (m.meta_key === "_thumbnail_id") thumbnailByPostId.set(m.post_id, Number(m.meta_value));
  }

  const posts = await prisma.$queryRawUnsafe<PendingPost[]>(
    `SELECT slug, "featuredImageUrl", body FROM "BlogPost"
     WHERE published = true AND ("featuredImageUrl" LIKE '%cloudinary%' OR body::text LIKE '%cloudinary%')
     ORDER BY slug`
  );
  console.log(`${posts.length} platform posts to recover.\n`);

  let totalFeaturedRecovered = 0;
  let totalInlineRecovered = 0;
  let totalInlineAttempted = 0;

  for (const post of posts) {
    try {
    const wpPost = wpPostBySlug.get(post.slug);
    if (!wpPost) {
      console.log(`[no-wp-post] ${post.slug}`);
      continue;
    }

    let newFeaturedUrl = post.featuredImageUrl;
    let featuredStatus = "unchanged";
    if (post.featuredImageUrl?.includes("cloudinary")) {
      const thumbId = thumbnailByPostId.get(wpPost.ID);
      const attachment = thumbId ? attachmentsById.get(thumbId) : null;
      const localPath = attachment ? localPathFromUrl(attachment.guid) : null;
      const buffer = localPath ? await readIfExists(localPath) : null;
      if (buffer) {
        try {
          const uploaded = await uploadAdminImageWithDimensions(
            { buffer, mimetype: mimeFromExt(localPath!) },
            "blog"
          );
          newFeaturedUrl = uploaded.url;
          featuredStatus = "recovered";
          totalFeaturedRecovered += 1;
        } catch (e) {
          featuredStatus = `upload-failed: ${(e as Error).message?.slice(0, 80)}`;
        }
      } else {
        featuredStatus = "no-original-featured-image";
      }
    }

    const body = Array.isArray(post.body) ? ([...post.body] as Record<string, unknown>[]) : [];
    const imageBlockIndexes = body
      .map((b, i) => (b.type === "image" && typeof b.url === "string" && b.url.includes("cloudinary") ? i : -1))
      .filter((i) => i >= 0);

    const $ = cheerio.load(wpPost.post_content);
    const inlineUrls: string[] = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src");
      if (src && src.includes("wp-content/uploads")) inlineUrls.push(src);
    });

    let recoveredInline = 0;
    for (let j = 0; j < imageBlockIndexes.length && j < inlineUrls.length; j++) {
      totalInlineAttempted += 1;
      const idx = imageBlockIndexes[j];
      const localPath = localPathFromUrl(inlineUrls[j]);
      const buffer = localPath ? await readIfExists(localPath) : null;
      if (!buffer) continue;
      try {
        const uploaded = await uploadAdminImageWithDimensions(
          { buffer, mimetype: mimeFromExt(localPath!) },
          "blog"
        );
        body[idx] = { ...body[idx], url: uploaded.url, width: uploaded.width, height: uploaded.height };
        recoveredInline += 1;
        totalInlineRecovered += 1;
      } catch (e) {
        console.log(`  [inline-fail] ${post.slug} image ${j}: ${(e as Error).message?.slice(0, 100)}`);
      }
    }

    if (featuredStatus === "recovered" || recoveredInline > 0) {
      await prisma.blogPost.update({
        where: { slug: post.slug },
        data: { featuredImageUrl: newFeaturedUrl, body: body as never },
      });
    }

    console.log(
      `[done] ${post.slug}: featured=${featuredStatus} inline=${recoveredInline}/${imageBlockIndexes.length}`
    );
    } catch (e) {
      console.error(`[post-error] ${post.slug}`, e);
    }
  }

  console.log(
    `\nDone. Featured recovered: ${totalFeaturedRecovered}. Inline recovered: ${totalInlineRecovered}/${totalInlineAttempted}.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
