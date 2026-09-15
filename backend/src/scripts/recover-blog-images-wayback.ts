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

const REQUEST_DELAY_MS = 1500;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * archive.org's asset replay is flaky under load — a file the CDX index
 * confirms exists (statuscode:200) still intermittently comes back as a
 * plain 404 with a "temporarily offline" error page. Since we only call
 * this after CDX already confirmed the capture exists, a 404 here is far
 * more likely a transient hiccup than a genuinely missing asset, so it's
 * retried the same as a 429 rather than treated as final.
 */
async function fetchWithRetry(url: string, retries = 2): Promise<Response | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20_000) });
      if (res.status === 429 || res.status === 404 || res.status >= 500) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      return res;
    } catch {
      await sleep(2000 * (attempt + 1));
    }
  }
  return null;
}

/**
 * Finds the nearest successfully-archived snapshot timestamp for a URL.
 *
 * CDX itself intermittently returns a bogus empty result (HTTP 200, no
 * rows) for a URL that's genuinely archived — verified directly: a URL
 * that came back empty here reliably returned a real row on a plain
 * retry seconds later. fetchWithRetry only guards against bad status
 * codes, not "200 but wrong/empty body", so that case needs its own
 * retry loop here — otherwise a real archive gets reported as missing.
 */
async function findSnapshot(url: string): Promise<string | null> {
  const cdx = `https://web.archive.org/cdx/search/cdx?url=${encodeURIComponent(url)}&output=json&filter=statuscode:200&limit=1`;
  for (let attempt = 0; attempt <= 1; attempt++) {
    const res = await fetchWithRetry(cdx);
    if (res && res.ok) {
      try {
        const data = (await res.json()) as string[][];
        if (data.length >= 2) return data[1][1];
      } catch {
        // fall through to retry
      }
    }
    if (attempt < 1) await sleep(2500);
  }
  return null;
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

/**
 * fetchWithRetry already retries within a single find-snapshot-then-download
 * attempt, but under concurrent load the whole sequence can still come up
 * empty (verified directly: an image logged as unrecoverable here downloaded
 * fine seconds later in isolation). Wrap the whole thing in an outer retry
 * too rather than accepting one failed pass as final.
 */
async function downloadArchivedImage(originalUrl: string): Promise<{ buffer: Buffer; contentType: string } | null> {
  for (let outerAttempt = 0; outerAttempt <= 1; outerAttempt++) {
    const ts = await findSnapshot(originalUrl);
    if (ts) {
      await sleep(REQUEST_DELAY_MS);
      const res = await fetchWithRetry(`https://web.archive.org/web/${ts}im_/${originalUrl}`);
      if (res && res.ok) {
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length >= 500) {
          return { buffer, contentType: res.headers.get("content-type") ?? "image/jpeg" };
        }
      }
    }
    if (outerAttempt < 1) await sleep(4000);
  }
  return null;
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
  let featuredStatus: "recovered" | "failed" | "none-found" | "already-fixed" = "already-fixed";
  if (featured && post.featuredImageUrl?.includes("cloudinary")) {
    const img = await downloadArchivedImage(featured);
    if (img) {
      const uploaded = await uploadAdminImageWithDimensions({ buffer: img.buffer, mimetype: img.contentType }, "blog");
      newFeaturedUrl = uploaded.url;
      featuredStatus = "recovered";
    } else {
      featuredStatus = "failed";
      console.log(`[featured] ${post.slug}: found in page but couldn't download from archive`);
    }
    await sleep(REQUEST_DELAY_MS);
  } else if (!featured && post.featuredImageUrl?.includes("cloudinary")) {
    featuredStatus = "none-found";
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
    `[done] ${post.slug}: featured=${featuredStatus} inline=${recovered}/${imageBlockIndexes.length}`
  );
}

/** Posts processed at once — each still paces its own archive.org requests, this just runs 3 independent streams in parallel. */
const POST_CONCURRENCY = 1;

async function main() {
  const posts = await prisma.$queryRawUnsafe<PendingPost[]>(
    `SELECT slug, "featuredImageUrl", body FROM "BlogPost"
     WHERE published = true AND category = 'Dealer Resources'
       AND ("featuredImageUrl" LIKE '%cloudinary%' OR body::text LIKE '%cloudinary%')
     ORDER BY slug`
  );
  console.log(`${posts.length} posts to recover.\n`);

  const queue = [...posts];
  const workers = Array.from({ length: Math.min(POST_CONCURRENCY, queue.length) }, async () => {
    for (;;) {
      const post = queue.shift();
      if (!post) return;
      try {
        await recoverPost(post);
      } catch (error) {
        console.error(`[error] ${post.slug}`, error);
      }
    }
  });
  await Promise.all(workers);

  console.log("\nDone.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
