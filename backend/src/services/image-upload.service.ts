import { v2 as cloudinary } from "cloudinary";
import { env } from "../config/env";
import { ValidationError } from "../errors/AppError";

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

export function isImageUploadConfigured(): boolean {
  return Boolean(env.cloudinaryUrl);
}

/** Uploads an admin-supplied image (e.g. blog featured image) to Cloudinary and returns its public URL. */
export async function uploadAdminImage(
  file: { buffer: Buffer; mimetype: string },
  folder: string
): Promise<string> {
  if (!isImageUploadConfigured()) {
    throw new ValidationError(
      "Image uploads are not configured (CLOUDINARY_URL missing)"
    );
  }
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    throw new ValidationError(
      "Unsupported image type. Use JPEG, PNG, WebP, or AVIF."
    );
  }

  cloudinary.config(true);
  const uploaded = await cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
    {
      folder: `autosalesreviews/${folder}`,
      resource_type: "image",
    }
  );
  return uploaded.secure_url;
}
