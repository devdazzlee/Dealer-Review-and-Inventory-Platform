/**
 * One-time migration: import the client's existing WordPress blog
 * (autosalesreviews.com/blog) into this platform's BlogPost table.
 *
 * Run locally only: `npx tsx src/scripts/migrate-wp-blog.ts [--dry-run]`
 * Not part of the deployed app — uses cheerio, installed locally
 * (`npm install cheerio@1.0.0-rc.12 --no-save`) and never added to
 * package.json, so it can't affect the production build.
 *
 * These 56 posts are dealership-operator advice (not car-buyer content
 * like the rest of the blog), so they're imported under their own
 * "Dealer Resources" category rather than mixed into the buyer-facing
 * categories.
 *
 * Inline body images: WordPress emits every in-article image as a
 * top-level `<figure class="wp-block-image">...<img/></figure>` sibling
 * (verified against all 56 posts — 709/709 images follow this exact
 * shape, none nested in a wrapping div, none as a bare `<img>`), so
 * htmlToBlocks below only needs to handle that one case. Each is
 * downloaded and re-uploaded to Cloudinary, same as the featured image.
 *
 * `--backfill-images` re-processes posts that are already imported —
 * regenerating their body from the current WordPress source (instead of
 * skipping, which is the default) — for backfilling images into the 55
 * posts that were originally imported before inline images were
 * supported. Only `body` is overwritten; title/excerpt/category/etc. on
 * the existing row are left untouched.
 */
import "dotenv/config";
import * as cheerio from "cheerio";
import type { Element as DomElement } from "domhandler";
import { prisma } from "../lib/prisma";
import {
  uploadAdminImage,
  uploadAdminImageWithDimensions,
} from "../services/image-upload.service";

const WP_API_BASE = "https://autosalesreviews.com/?rest_route=/wp/v2/posts";
const CATEGORY = "Dealer Resources";
const DRY_RUN = process.argv.includes("--dry-run");
const BACKFILL_IMAGES = process.argv.includes("--backfill-images");

// Internal WordPress test content, not real articles — excluded rather
// than imported alongside genuine posts.
const EXCLUDED_SLUGS = new Set(["test-post-for-ad-test"]);

interface WpPost {
  id: number;
  slug: string;
  date: string;
  title: { rendered: string };
  content: { rendered: string };
  excerpt: { rendered: string };
  _embedded?: {
    author?: { name: string }[];
    "wp:featuredmedia"?: { source_url: string }[];
  };
}

type InlinePart = string | { link: string; href: string };
type ArticleBlock =
  | { type: "p"; parts: InlinePart[] }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "quote"; text: string }
  | {
      type: "image";
      url: string;
      alt: string;
      width: number;
      height: number;
      caption?: string;
    };

async function fetchAllPosts(): Promise<WpPost[]> {
  const res = await fetch(`${WP_API_BASE}&per_page=100&_embed=1`);
  if (!res.ok) {
    throw new Error(`WordPress API request failed: ${res.status}`);
  }
  return res.json();
}

function decodeHtmlText($el: cheerio.Cheerio<DomElement>): string {
  return $el.text().replace(/ /g, " ").replace(/\s+/g, " ").trim();
}

/** Inline children of a <p> become InlinePart[] — plain text runs plus <a> links. */
function paragraphParts($: cheerio.CheerioAPI, el: DomElement): InlinePart[] {
  const parts: InlinePart[] = [];
  $(el)
    .contents()
    .each((_, node) => {
      if (node.type === "text") {
        const text = (node.data ?? "").replace(/ /g, " ");
        if (text.trim()) parts.push(text);
      } else if (node.type === "tag" && node.name === "a") {
        const href = $(node).attr("href");
        const text = decodeHtmlText($(node));
        if (href && text) parts.push({ link: text, href });
        else if (text) parts.push(text);
      } else if (node.type === "tag") {
        // strong/em/span/etc — flatten to plain text, formatting isn't in our block schema.
        const text = decodeHtmlText($(node));
        if (text) parts.push(text);
      }
    });
  return parts;
}

/**
 * Downloads one inline image and re-uploads it to Cloudinary (mirroring
 * the featured-image handling below). Returns null on any failure — a
 * single broken image shouldn't abort the whole post, same reasoning as
 * the featured-image fetch.
 */
async function fetchAndUploadInlineImage(
  src: string,
  alt: string,
  caption: string | undefined,
  folder: string,
  title: string
): Promise<ArticleBlock | null> {
  try {
    const imgRes = await fetch(src);
    if (!imgRes.ok) {
      console.warn(`[image] "${title}" — inline image ${src} returned ${imgRes.status}`);
      return null;
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
    const { url, width, height } = await uploadAdminImageWithDimensions(
      { buffer, mimetype: contentType },
      folder
    );
    return { type: "image", url, alt, width, height, caption };
  } catch (err) {
    console.warn(`[image] "${title}" — failed to fetch/upload inline image ${src}:`, err);
    return null;
  }
}

/**
 * Converts WordPress Gutenberg HTML into this platform's ArticleBlock[]
 * format.
 *
 * WordPress emits numbered lists as a separate <ol start="N"> per item
 * (one <li> each) rather than one <ol> with multiple <li> — consecutive
 * list elements are merged back into a single block here.
 *
 * Every in-article image is a top-level <figure class="wp-block-image">
 * wrapping a single <img> (verified against all 56 source posts — see
 * file header) — each is downloaded and re-uploaded to Cloudinary rather
 * than hotlinked, same as the featured image.
 */
async function htmlToBlocks(
  html: string,
  imageFolder: string,
  title: string,
  { uploadImages }: { uploadImages: boolean }
): Promise<ArticleBlock[]> {
  const $ = cheerio.load(html);
  const blocks: ArticleBlock[] = [];

  for (const el of $("body").children().toArray()) {
    const tag = el.type === "tag" ? el.name : null;
    if (!tag) continue;

    if (tag === "p") {
      const parts = paragraphParts($, el);
      const hasText = parts.some(
        (p) => typeof p === "string" ? p.trim().length > 0 : p.link.trim().length > 0
      );
      if (hasText) blocks.push({ type: "p", parts });
      continue;
    }

    if (tag === "h2") {
      const text = decodeHtmlText($(el));
      if (text) blocks.push({ type: "h2", text });
      continue;
    }

    if (tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
      const text = decodeHtmlText($(el));
      if (text) blocks.push({ type: "h3", text });
      continue;
    }

    if (tag === "ul" || tag === "ol") {
      const items = $(el)
        .find("> li")
        .map((__, li) => decodeHtmlText($(li)))
        .get()
        .filter(Boolean);
      if (items.length === 0) continue;

      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") {
        last.items.push(...items);
      } else {
        blocks.push({ type: "ul", items });
      }
      continue;
    }

    if (tag === "blockquote") {
      const text = decodeHtmlText($(el));
      if (text) blocks.push({ type: "quote", text });
      continue;
    }

    if (tag === "figure") {
      const img = $(el).find("img").first();
      const src = img.attr("src");
      if (!src) continue;
      const alt = img.attr("alt") || "";
      const captionEl = $(el).find("figcaption").first();
      const caption = captionEl.length ? decodeHtmlText(captionEl) : undefined;

      if (!uploadImages) continue; // --dry-run / --inspect: skip the network round trip
      const block = await fetchAndUploadInlineImage(src, alt, caption, imageFolder, title);
      if (block) blocks.push(block);
      continue;
    }

    // script/style/div wrappers etc. — no block type for these; if a
    // wrapper div contains real paragraph-like text we'd otherwise lose
    // entirely, fall back to a plain paragraph so content isn't silently
    // dropped.
    if (tag === "div" || tag === "section") {
      const text = decodeHtmlText($(el));
      if (text && !$(el).find("figure,img,script,style").length) {
        blocks.push({ type: "p", parts: [text] });
      }
    }
  }

  return blocks;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

type MigrateResult = "created" | "backfilled" | "skipped" | "dry-run";

async function migrateOnePost(wp: WpPost): Promise<MigrateResult> {
  if (EXCLUDED_SLUGS.has(wp.slug)) {
    console.log(`[skip] "${wp.title.rendered}" — excluded (internal test content)`);
    return "skipped";
  }

  const title = decodeHtmlText(cheerio.load(wp.title.rendered).root());
  const excerptHtml = wp.excerpt.rendered;
  const excerpt = decodeHtmlText(cheerio.load(excerptHtml).root());
  const author = wp._embedded?.author?.[0]?.name ?? "David";
  const body = await htmlToBlocks(wp.content.rendered, "blog", title, {
    uploadImages: !DRY_RUN,
  });

  if (body.length === 0) {
    console.warn(`[skip] "${title}" — no parseable content blocks`);
    return "skipped";
  }

  // Dry-run skips the actual fetch/upload (see htmlToBlocks), so `body`
  // never contains real image blocks in that mode — count <figure> tags
  // in the raw source directly instead, so the preview is still accurate.
  const detectedImages = (wp.content.rendered.match(/<figure/g) ?? []).length;

  const existing = await prisma.blogPost.findUnique({ where: { slug: wp.slug } });
  if (existing) {
    if (!BACKFILL_IMAGES) {
      console.log(`[skip] "${title}" — slug "${wp.slug}" already imported`);
      return "skipped";
    }
    if (DRY_RUN) {
      console.log(
        `[dry-run] would backfill "${title}" (${wp.slug}) — ${body.length} blocks, ${detectedImages} images detected`
      );
      return "dry-run";
    }
    const imageCount = body.filter((b) => b.type === "image").length;
    await prisma.blogPost.update({
      where: { slug: wp.slug },
      data: { body: body as unknown as object },
    });
    console.log(
      `[backfilled] "${title}" (${wp.slug}) — ${body.length} blocks, ${imageCount} images`
    );
    return "backfilled";
  }

  let featuredImageUrl: string | null = null;
  const sourceImageUrl = wp._embedded?.["wp:featuredmedia"]?.[0]?.source_url;
  if (sourceImageUrl && !DRY_RUN) {
    try {
      const imgRes = await fetch(sourceImageUrl);
      if (imgRes.ok) {
        const buffer = Buffer.from(await imgRes.arrayBuffer());
        const contentType = imgRes.headers.get("content-type") ?? "image/jpeg";
        featuredImageUrl = await uploadAdminImage(
          { buffer, mimetype: contentType },
          "blog"
        );
      } else {
        console.warn(`[image] "${title}" — source image ${sourceImageUrl} returned ${imgRes.status}`);
      }
    } catch (err) {
      console.warn(`[image] "${title}" — failed to fetch/upload featured image:`, err);
    }
  }

  const data = {
    slug: wp.slug,
    title,
    excerpt: truncate(excerpt, 220),
    category: CATEGORY,
    author,
    authorRole: "Staff Writer",
    authorBio: null,
    featuredImageUrl,
    featuredImageAlt: title,
    body: body as unknown as object,
    faqs: [] as unknown as object,
    metaTitle: truncate(title, 60),
    metaDescription: truncate(excerpt, 155),
    published: true,
    featured: false,
    publishedAt: new Date(wp.date),
  };

  if (DRY_RUN) {
    console.log(`[dry-run] would import "${title}" (${wp.slug}) — ${body.length} blocks, ${detectedImages} images detected, featured image: ${sourceImageUrl ?? "none"}`);
    return "dry-run";
  }

  await prisma.blogPost.create({ data });
  console.log(`[ok] imported "${title}" (${wp.slug}) — ${body.length} blocks`);
  return "created";
}

async function main() {
  console.log(DRY_RUN ? "Running in --dry-run mode (no writes)." : "Running for real — writing to the database.");
  if (BACKFILL_IMAGES) console.log("Backfill mode: re-processing already-imported posts too.");
  let posts = await fetchAllPosts();
  console.log(`Fetched ${posts.length} posts from WordPress.\n`);

  const onlySlug = process.argv.find((a) => a.startsWith("--only="))?.split("=")[1];
  if (onlySlug) {
    posts = posts.filter((p) => p.slug === onlySlug);
    if (posts.length === 0) {
      console.log(`No post with slug "${onlySlug}" — nothing to do.`);
      await prisma.$disconnect();
      return;
    }
    console.log(`--only="${onlySlug}": restricting to 1 post.\n`);
  }

  const inspectSlug = process.argv.find((a) => a.startsWith("--inspect="))?.split("=")[1];
  if (inspectSlug) {
    const post = posts.find((p) => p.slug === inspectSlug);
    if (!post) {
      console.log(`No post with slug "${inspectSlug}"`);
    } else {
      const blocks = await htmlToBlocks(post.content.rendered, "blog", post.slug, {
        uploadImages: false,
      });
      console.log(JSON.stringify(blocks, null, 2));
    }
    await prisma.$disconnect();
    return;
  }

  let created = 0;
  let backfilled = 0;
  let skipped = 0;
  let dryRunPreview = 0;
  let failed = 0;

  for (const post of posts) {
    try {
      const result = await migrateOnePost(post);
      if (result === "created") created++;
      else if (result === "backfilled") backfilled++;
      else if (result === "dry-run") dryRunPreview++;
      else skipped++;
    } catch (err) {
      failed++;
      console.error(`[fail] post id ${post.id} (${post.slug}):`, err);
    }
  }

  console.log(
    DRY_RUN
      ? `\nDone. Would affect: ${dryRunPreview}, skipped: ${skipped}, failed: ${failed}. (dry-run — nothing written; inline images aren't fetched/counted in this mode)`
      : `\nDone. Imported: ${created}, backfilled: ${backfilled}, skipped: ${skipped}, failed: ${failed}.`
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
