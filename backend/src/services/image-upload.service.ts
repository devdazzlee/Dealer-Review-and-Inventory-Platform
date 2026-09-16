import { v2 as cloudinary } from "cloudinary";
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { env } from "../config/env";
import { ValidationError } from "../errors/AppError";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const UPLOAD_ROOT = path.join(process.cwd(), "uploads", "admin");
const LOCAL_MAX_DIMENSION = 1600; // admin/editorial images run larger than vehicle thumbnails
const LOCAL_QUALITY = 75;

/** Always true now — Cloudinary is optional; local disk is the fallback. */
export function isImageUploadConfigured(): boolean {
  return true;
}

interface UploadResult {
  url: string;
  width: number;
  height: number;
}

async function uploadToCloudinary(
  file: { buffer: Buffer; mimetype: string },
  folder: string
): Promise<UploadResult> {
  cloudinary.config(true);
  const uploaded = await cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
    {
      folder: `autosalesreviews/${folder}`,
      resource_type: "image",
    }
  );
  return { url: uploaded.secure_url, width: uploaded.width, height: uploaded.height };
}

/**
 * Same role as the Cloudinary path, used whenever CLOUDINARY_URL isn't set
 * (including now, with the account deactivated). Mirrors the resize/quality
 * settings already proven for vehicle photos in photo-cache.service.ts —
 * served the same way, via the existing `/uploads` static route.
 */
async function storeLocally(
  file: { buffer: Buffer; mimetype: string },
  folder: string
): Promise<UploadResult> {
  const resized = sharp(file.buffer).rotate().resize({
    width: LOCAL_MAX_DIMENSION,
    height: LOCAL_MAX_DIMENSION,
    fit: "inside",
    withoutEnlargement: true,
  });
  const buffer = await resized.webp({ quality: LOCAL_QUALITY }).toBuffer();
  const meta = await sharp(buffer).metadata();

  const dir = path.join(UPLOAD_ROOT, folder);
  await fs.mkdir(dir, { recursive: true });
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.webp`;
  await fs.writeFile(path.join(dir, filename), buffer);

  return {
    url: `/uploads/admin/${folder}/${filename}`,
    width: meta.width ?? 0,
    height: meta.height ?? 0,
  };
}

async function uploadImage(
  file: { buffer: Buffer; mimetype: string },
  folder: string
): Promise<UploadResult> {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new ValidationError(
      "Unsupported image type. Use JPEG, PNG, WebP, or AVIF."
    );
  }

  // Prefer Cloudinary when configured, but fall back to local disk if the
  // account is disabled/locked — blog recovery and admin uploads must still work.
  if (env.cloudinaryUrl) {
    try {
      return await uploadToCloudinary(file, folder);
    } catch (error) {
      console.warn(
        `[image-upload] Cloudinary failed for folder="${folder}", storing locally:`,
        error instanceof Error ? error.message : error
      );
    }
  }
  return storeLocally(file, folder);
}

/** Uploads an admin-supplied image (e.g. blog featured image) and returns its public URL. */
export async function uploadAdminImage(
  file: { buffer: Buffer; mimetype: string },
  folder: string
): Promise<string> {
  const uploaded = await uploadImage(file, folder);
  return uploaded.url;
}

/** Same as {@link uploadAdminImage}, but also returns the image's natural
 * dimensions — needed for callers (like inline article images) that render
 * with next/image and must set width/height to avoid layout shift. */
export async function uploadAdminImageWithDimensions(
  file: { buffer: Buffer; mimetype: string },
  folder: string
): Promise<{ url: string; width: number; height: number }> {
  return uploadImage(file, folder);
}
