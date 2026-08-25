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
 */
import "dotenv/config";
import * as cheerio from "cheerio";
import type { Element as DomElement } from "domhandler";
import { prisma } from "../lib/prisma";
import { uploadAdminImage } from "../services/image-upload.service";

const WP_API_BASE = "https://autosalesreviews.com/?rest_route=/wp/v2/posts";
const CATEGORY = "Dealer Resources";
const DRY_RUN = process.argv.includes("--dry-run");

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
  | { type: "quote"; text: string };

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
 * Converts WordPress Gutenberg HTML into this platform's ArticleBlock[]
 * format. Inline <figure>/<img> content is intentionally dropped — the
 * block schema only supports one featured image per post, not inline
 * images, and bolting that on as a side effect of a data migration would
 * be exactly the kind of rushed patch we're avoiding.
 *
 * WordPress emits numbered lists as a separate <ol start="N"> per item
 * (one <li> each) rather than one <ol> with multiple <li> — consecutive
 * list elements are merged back into a single block here.
 */
function htmlToBlocks(html: string): ArticleBlock[] {
  const $ = cheerio.load(html);
  const blocks: ArticleBlock[] = [];

  $("body")
    .children()
    .each((_, el) => {
      const tag = el.type === "tag" ? el.name : null;
      if (!tag) return;

      if (tag === "p") {
        const parts = paragraphParts($, el);
        const hasText = parts.some(
          (p) => typeof p === "string" ? p.trim().length > 0 : p.link.trim().length > 0
        );
        if (hasText) blocks.push({ type: "p", parts });
        return;
      }

      if (tag === "h2") {
        const text = decodeHtmlText($(el));
        if (text) blocks.push({ type: "h2", text });
        return;
      }

      if (tag === "h3" || tag === "h4" || tag === "h5" || tag === "h6") {
        const text = decodeHtmlText($(el));
        if (text) blocks.push({ type: "h3", text });
        return;
      }

      if (tag === "ul" || tag === "ol") {
        const items = $(el)
          .find("> li")
          .map((__, li) => decodeHtmlText($(li)))
          .get()
          .filter(Boolean);
        if (items.length === 0) return;

        const last = blocks[blocks.length - 1];
        if (last?.type === "ul") {
          last.items.push(...items);
        } else {
          blocks.push({ type: "ul", items });
        }
        return;
      }

      if (tag === "blockquote") {
        const text = decodeHtmlText($(el));
        if (text) blocks.push({ type: "quote", text });
        return;
      }

      // figure/img/script/style/div wrappers etc. — no block type for
      // these; if a wrapper div contains real paragraph-like text we'd
      // otherwise lose entirely, fall back to a plain paragraph so
      // content isn't silently dropped.
      if (tag === "div" || tag === "section") {
        const text = decodeHtmlText($(el));
        if (text && !$(el).find("figure,img,script,style").length) {
          blocks.push({ type: "p", parts: [text] });
        }
      }
    });

  return blocks;
}

function truncate(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max - 1).trimEnd()}…`;
}

async function migrateOnePost(wp: WpPost): Promise<void> {
  if (EXCLUDED_SLUGS.has(wp.slug)) {
    console.log(`[skip] "${wp.title.rendered}" — excluded (internal test content)`);
    return;
  }

  const title = decodeHtmlText(cheerio.load(wp.title.rendered).root());
  const excerptHtml = wp.excerpt.rendered;
  const excerpt = decodeHtmlText(cheerio.load(excerptHtml).root());
  const author = wp._embedded?.author?.[0]?.name ?? "David";
  const body = htmlToBlocks(wp.content.rendered);

  if (body.length === 0) {
    console.warn(`[skip] "${title}" — no parseable content blocks`);
    return;
  }

  const existing = await prisma.blogPost.findUnique({ where: { slug: wp.slug } });
  if (existing) {
    console.log(`[skip] "${title}" — slug "${wp.slug}" already imported`);
    return;
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
    console.log(`[dry-run] would import "${title}" (${wp.slug}) — ${body.length} blocks, image: ${sourceImageUrl ?? "none"}`);
    return;
  }

  await prisma.blogPost.create({ data });
  console.log(`[ok] imported "${title}" (${wp.slug}) — ${body.length} blocks`);
}

async function main() {
  console.log(DRY_RUN ? "Running in --dry-run mode (no writes)." : "Running for real — writing to the database.");
  const posts = await fetchAllPosts();
  console.log(`Fetched ${posts.length} posts from WordPress.\n`);

  const inspectSlug = process.argv.find((a) => a.startsWith("--inspect="))?.split("=")[1];
  if (inspectSlug) {
    const post = posts.find((p) => p.slug === inspectSlug);
    if (!post) {
      console.log(`No post with slug "${inspectSlug}"`);
    } else {
      console.log(JSON.stringify(htmlToBlocks(post.content.rendered), null, 2));
    }
    await prisma.$disconnect();
    return;
  }

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const post of posts) {
    try {
      const before = await prisma.blogPost.count();
      await migrateOnePost(post);
      const after = DRY_RUN ? before : await prisma.blogPost.count();
      if (after > before) ok++;
      else skipped++;
    } catch (err) {
      failed++;
      console.error(`[fail] post id ${post.id} (${post.slug}):`, err);
    }
  }

  console.log(`\nDone. Imported: ${ok}, skipped: ${skipped}, failed: ${failed}.`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
