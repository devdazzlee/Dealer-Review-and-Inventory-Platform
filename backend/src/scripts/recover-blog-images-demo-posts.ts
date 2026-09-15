import "dotenv/config";
import { prisma } from "../lib/prisma";
import { uploadAdminImageWithDimensions } from "../services/image-upload.service";

/**
 * The 5 buyer-facing demo posts (unlike the 55 "Dealer Resources" posts)
 * were never sourced from the old WordPress site — they were authored
 * directly on this platform with a stock featured image uploaded straight
 * to Cloudinary. There's no original to recover, so this just picks a new
 * stock photo per post from Pexels (already have a free API key configured,
 * just never wired up before) rather than migrating anything.
 */

const PEXELS_KEY = process.env.PEXELS_API_KEY;

const QUERIES: Record<string, string> = {
  "best-time-of-year-to-buy-a-car": "car dealership sale",
  "leasing-vs-buying-2026": "car keys hand new car",
  "is-an-extended-warranty-worth-it": "mechanic car repair",
  "how-to-spot-a-lemon-before-you-sign": "car inspection mechanic",
  "credit-score-and-your-auto-loan": "car loan paperwork signing",
};

async function searchPexels(query: string): Promise<{ url: string; contentType: string } | null> {
  if (!PEXELS_KEY) throw new Error("PEXELS_API_KEY not set");
  const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
    headers: { Authorization: PEXELS_KEY },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { photos: { src: { large2x: string } }[] };
  const photo = data.photos[0];
  if (!photo) return null;
  return { url: photo.src.large2x, contentType: "image/jpeg" };
}

async function main() {
  for (const [slug, query] of Object.entries(QUERIES)) {
    const post = await prisma.blogPost.findUnique({ where: { slug }, select: { slug: true, featuredImageUrl: true } });
    if (!post) {
      console.log(`[skip] ${slug}: not found`);
      continue;
    }
    if (!post.featuredImageUrl?.includes("cloudinary")) {
      console.log(`[skip] ${slug}: already fixed`);
      continue;
    }

    const picked = await searchPexels(query);
    if (!picked) {
      console.log(`[fail] ${slug}: no Pexels result for "${query}"`);
      continue;
    }

    const imgRes = await fetch(picked.url);
    if (!imgRes.ok) {
      console.log(`[fail] ${slug}: couldn't download picked image`);
      continue;
    }
    const buffer = Buffer.from(await imgRes.arrayBuffer());
    const uploaded = await uploadAdminImageWithDimensions({ buffer, mimetype: picked.contentType }, "blog");

    await prisma.blogPost.update({ where: { slug }, data: { featuredImageUrl: uploaded.url } });
    console.log(`[done] ${slug}: new image from Pexels ("${query}")`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
