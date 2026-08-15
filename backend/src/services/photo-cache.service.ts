import { v2 as cloudinary } from "cloudinary";
import fs from "fs/promises";
import path from "path";
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

function extensionFromContentType(type: string | null): string {
  if (!type) return "jpg";
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("avif")) return "avif";
  return "jpg";
}

function isCachedUrl(url: string): boolean {
  return (
    url.includes("res.cloudinary.com") || url.includes("/uploads/vehicles/")
  );
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

async function storePhoto(
  vin: string,
  index: number,
  bytes: Buffer,
  contentType: string
): Promise<string> {
  if (env.cloudinaryUrl) {
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

  const ext = extensionFromContentType(contentType);
  const dir = path.join(UPLOAD_ROOT, vin);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${index}.${ext}`;
  await fs.writeFile(path.join(dir, filename), bytes);
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
  photoCount?: number
): Promise<string[]> {
  const urls: string[] = [];
  const cap = Math.min(
    AUTODEV.maxPhotosPerVin,
    photoCount && photoCount > 0 ? photoCount : AUTODEV.maxPhotosPerVin
  );

  for (let index = 1; index <= cap; index++) {
    try {
      if (env.cloudinaryUrl) {
        const existingUrl = await findExistingCloudinaryUrl(vin, index);
        if (existingUrl) {
          urls.push(existingUrl);
          continue;
        }
      }

      const image = await downloadIndex(vin, index);
      if (!image) break;
      const stored = await storePhoto(vin, index, image.bytes, image.contentType);
      urls.push(stored);
    } catch (error) {
      console.error(`[photo-cache] VIN ${vin} index ${index}`, error);
      if (urls.length === 0) continue;
      break;
    }
  }

  return urls;
}
