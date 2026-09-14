import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import { env } from "../config/env";
import { AUTODEV } from "../config/constants";
import { fetchWithRetry } from "../lib/http";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  Referer: "https://www.auto.dev/",
  "Accept-Language": "en-US,en;q=0.9",
};

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "vehicles");
const CLOUDINARY_FOLDER = "autosalesreviews/vehicles";

function photoCandidates(vin: string, index: number): string[] {
  const base = env.autoDevPhotoBaseUrl.replace(/\/$/, "");
  return [
    `https://retail.photos.vin/${vin}-${index}.jpg`,
    `${AUTODEV.baseUrl}/photos/retail/${vin}-${index}.jpg`,
    `${base}/${vin}/${index}`,
    `${base}/${vin}/${index}.jpg`,
    `${base}/${vin}/${index}.jpeg`,
    `${base}/${vin}/${index}.webp`,
  ];
}

/**
 * Cloudinary's account is deactivated (permanently, for our purposes) — a
 * res.cloudinary.com URL is a dead reference now, not a cached photo. Only
 * our own local storage counts as "already cached". Treating Cloudinary
 * URLs as valid here was what let dead references get silently reused
 * (e.g. syncDealerListings carrying `existing.photos` forward untouched)
 * instead of being re-fetched.
 */
function isCachedUrl(url: string): boolean {
  return url.includes("/uploads/vehicles/");
}

function downloadHeaders(url: string): Record<string, string> {
  const headers = { ...BROWSER_HEADERS };
  if (url.startsWith(AUTODEV.baseUrl) && env.autoDevApiKey) {
    headers.Authorization = `Bearer ${env.autoDevApiKey}`;
  }
  return headers;
}

async function downloadIndex(vin: string, index: number): Promise<{
  bytes: Buffer;
  contentType: string;
} | null> {
  for (const url of photoCandidates(vin, index)) {
    const response = await fetchWithRetry(
      url,
      { headers: downloadHeaders(url) },
      { retries: 1, timeoutMs: 15_000 }
    );
    if (response.status !== 200) continue;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length < 500) continue;
    return {
      bytes,
      contentType: response.headers.get("content-type") ?? "image/jpeg",
    };
  }
  return null;
}

function cloudinaryPublicId(vin: string, index: number): string {
  return `${CLOUDINARY_FOLDER}/${vin}/${index}`;
}

/** Avoid re-downloading from Auto.dev and re-uploading if this index is already cached. */
async function findExistingCloudinaryUrl(
  vin: string,
  index: number
): Promise<string | null> {
  cloudinary.config(true);
  try {
    const resource = await cloudinary.api.resource(cloudinaryPublicId(vin, index), {
      resource_type: "image",
    });
    return resource.secure_url ?? null;
  } catch {
    return null;
  }
}

/**
 * Cap on the long edge, and the quality target, for locally-stored photos.
 * Full-size dealer photos run 150KB-750KB each; at fleet scale (250k+
 * images) that doesn't fit the VPS disk. Resized WebP at this size holds a
 * vehicle listing photo's real detail while landing around 60-150KB.
 */
const LOCAL_PHOTO_MAX_DIMENSION = 1024;
const LOCAL_PHOTO_QUALITY = 70;

/** Downscales-only (never upscales a smaller source) and re-encodes to WebP. */
async function resizeForLocalStorage(bytes: Buffer): Promise<Buffer> {
  return sharp(bytes)
    .rotate() // apply EXIF orientation before stripping metadata
    .resize({
      width: LOCAL_PHOTO_MAX_DIMENSION,
      height: LOCAL_PHOTO_MAX_DIMENSION,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: LOCAL_PHOTO_QUALITY })
    .toBuffer();
}

async function storePhoto(
  vin: string,
  index: number,
  bytes: Buffer,
  contentType: string,
  forceLocal = false
): Promise<string> {
  if (env.cloudinaryUrl && !forceLocal) {
    cloudinary.config(true);
    const uploaded = await cloudinary.uploader.upload(
      `data:${contentType};base64,${bytes.toString("base64")}`,
      {
        folder: `${CLOUDINARY_FOLDER}/${vin}`,
        public_id: String(index),
        overwrite: true,
        resource_type: "image",
      }
    );
    return uploaded.secure_url;
  }

  const dir = path.join(UPLOAD_ROOT, vin);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${index}.webp`;
  const resized = await resizeForLocalStorage(bytes);
  await fs.writeFile(path.join(dir, filename), resized);
  return `/uploads/vehicles/${vin}/${filename}`;
}

export function photosAreCached(urls: string[]): boolean {
  return urls.length > 0 && urls.every(isCachedUrl);
}

export function publicPhotoUrls(urls: string[]): string[] {
  return urls.filter(isCachedUrl);
}

export async function cacheListingPhotos(
  vin: string,
  photoCount?: number,
  options?: { forceLocal?: boolean }
): Promise<string[]> {
  const forceLocal = options?.forceLocal ?? false;
  const urls: string[] = [];
  const cap = Math.min(
    AUTODEV.maxPhotosPerVin,
    photoCount && photoCount > 0 ? photoCount : AUTODEV.maxPhotosPerVin
  );

  for (let index = 1; index <= cap; index++) {
    try {
      if (env.cloudinaryUrl && !forceLocal) {
        const existingUrl = await findExistingCloudinaryUrl(vin, index);
        if (existingUrl) {
          urls.push(existingUrl);
          continue;
        }
      }

      const image = await downloadIndex(vin, index);
      if (!image) break;
      const stored = await storePhoto(vin, index, image.bytes, image.contentType, forceLocal);
      urls.push(stored);
    } catch (error) {
      console.error(`[photo-cache] VIN ${vin} index ${index}`, error);
      if (urls.length === 0) continue;
      break;
    }
  }

  return urls;
}
