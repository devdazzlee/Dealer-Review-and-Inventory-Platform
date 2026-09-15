import "dotenv/config";
import * as cheerio from "cheerio";
import { prisma } from "../lib/prisma";
import { uploadAdminImageWithDimensions } from "../services/image-upload.service";

/**
 * The 55 "Dealer Resources" posts were migrated from the client's old
 * WordPress site (autosalesreviews.com/blog) and their images uploaded to
 * Cloudinary. Cloudinary is now dead, and the WordPress site itself is gone
 * (the domain now serves this platform), so there's no live source left to
 * re-fetch from. The Wayback Machine has archived snapshots of the old
 * blog with the original wp-content image paths intact, so this recovers
 * from there instead — same idea as migrate-photos-to-local.ts re-deriving
 * from Auto.dev once Cloudinary died, just a different source.
 *
 * Deliberately paced (2s between archive.org requests, retries with
 * backoff on 429s) — archive.org rate-limits aggressively and a burst of
 * requests just returns fake-looking 404 shell pages instead of the asset.
 */

const REQUEST_DELAY_MS = 2500;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string, retries = 4): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 429) {
        await sleep(6000 * (attempt + 1));
        continue;
      }
      return res;
    } catch {
      await sleep(3000 * (attempt + 1));
    }
  }
  return null;
}

/** Finds the nearest successfully-archived snapshot timestamp for a URL. */
async function findSnapshot(url: string): Promise<string | null> {
  const cdx = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&filter=statuscode:200&limit=1`;
  const res = await fetchWithRetry(cdx);
  if (!res || !res.ok) return null;
  try {
    const data = (await res.json()) as string[][];
    if (data.length < 2) return null;
    return data[1][1];
  } catch {
    return null;
  }
}

async function fetchArchivedPage(slug: string): Promise<string | null> {
  const pageUrl = `https://autosalesreviews.com/blog/${slug}/`;
  const ts = await findSnapshot(pageUrl);
  if (!ts) return null;
  await sleep(REQUEST_DELAY_MS);
  const res = await fetchWithRetry(`https://web.archive.org/web/${ts}/${pageUrl}`);
  if (!res || !res.ok) return null;
  return res.text();
}

/** Strips the Wayback prefix off an embedded snapshot image src, back to the real original URL. */
function toOriginalUrl(waybackSrc: string): string {
  const m = waybackSrc.match(/\/web\/\d+\w*\/(https?:\/\/.+)$/);
  return m ? m[1] : waybackSrc;
}

/**
 * Not every archived post uses the same theme markup — newer ones are
 * Gutenberg blocks (`img.wp-post-image` featured, `figure.wp-block-image`
 * inline), older ones (Classic Editor era) just have plain `<img>` tags
 * inside `.entry-content` with no featured-image class at all. Try the
 * specific selectors first, fall back to looser ones so older posts aren't
 * silently skipped.
 */
function extractImages($: cheerio.CheerioAPI): { featured: string | null; inline: string[] } {
  let featuredSrc = $("img.wp-post-image").first().attr("src");
  if (!featuredSrc) featuredSrc = $('meta[property="og:image"]').attr("content");
  const featured = featuredSrc ? toOriginalUrl(featuredSrc) : null;

  const inline: string[] = [];
  let imgs = $(".entry-content figure.wp-block-image img");
  if (imgs.length === 0) imgs = $(".entry-content img");
  imgs.each((_, el) => {
    const src = $(el).attr("src");
    if (src && toOriginalUrl(src) !== featured) inline.push(toOriginalUrl(src));
  });
  return { featured, inline };
}

async function downloadArchivedImage(originalUrl: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  const ts = await findSnapshot(originalUrl);
  if (!ts) return null;
  await sleep(REQUEST_DELAY_MS);
  const res = await fetchWithRetry(`https://web.archive.org/web/${ts}im_/${originalUrl}`);
  if (!res || !res.ok) return null;
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 500) return null;
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  return { buffer, contentType };
}

interface PendingPost {
  slug: string;
  featuredImageUrl: string | null;
  body: unknown;
}

async function recoverPost(post: PendingPost): Promise<void> {
  const html = await fetchArchivedPage(post.slug);
  if (!html) {
    console.log(`[skip] ${post.slug}: no archived page found on Wayback`);
    return;
  }
  const $ = cheerio.load(html);
  const { featured, inline } = extractImages($);

  let newFeaturedUrl = post.featuredImageUrl;
  if (featured && post.featuredImageUrl?.includes("cloudinary")) {
    const img = await downloadArchivedImage(featured);
    if (img) {
      const uploaded = await uploadAdminImageWithDimensions({ buffer: img.buffer, mimetype: img.contentType }, "blog");
      newFeaturedUrl = uploaded.url;
    } else {
      console.log(`[featured] ${post.slug}: found in page but couldn't download from archive`);
    }
    await sleep(REQUEST_DELAY_MS);
  }

  const body = Array.isArray(post.body) ? (post.body as Record<string, unknown>[]) : [];
  const imageBlockIndexes = body
    .map((b, i) => (b.type === "image" ? i : -1))
    .filter((i) => i >= 0);

  let recovered = 0;
  for (let j = 0; j < imageBlockIndexes.length && j < inline.length; j++) {
    const idx = imageBlockIndexes[j];
    const block = body[idx];
    if (typeof block.url !== "string" || !block.url.includes("cloudinary")) continue;

    const img = await downloadArchivedImage(inline[j]);
    if (img) {
      const uploaded = await uploadAdminImageWithDimensions({ buffer: img.buffer, mimetype: img.contentType }, "blog");
      body[idx] = { ...block, url: uploaded.url, width: uploaded.width, height: uploaded.height };
      recovered += 1;
    }
    await sleep(REQUEST_DELAY_MS);
  }

  await prisma.blogPost.update({
    where: { slug: post.slug },
    data: { featuredImageUrl: newFeaturedUrl, body: body as never },
  });

  console.log(
    `[done] ${post.slug}: featured=${featured ? (newFeaturedUrl !== post.featuredImageUrl ? "recovered" : "failed") : "none-found"} inline=${recovered}/${imageBlockIndexes.length}`
  );
}

async function main() {
  const posts = await prisma.$queryRawUnsafe<PendingPost[]>(
    `SELECT slug, "featuredImageUrl", body FROM "BlogPost"
     WHERE published = true AND category = 'Dealer Resources'
       AND ("featuredImageUrl" LIKE '%cloudinary%' OR body::text LIKE '%cloudinary%')
     ORDER BY slug`
  );
  console.log(`${posts.length} posts to recover.\n`);

  for (const post of posts) {
    try {
      await recoverPost(post);
    } catch (error) {
      console.error(`[error] ${post.slug}`, error);
    }
  }

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
