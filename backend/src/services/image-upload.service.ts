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

async function uploadToCloudinary(
  file: { buffer: Buffer; mimetype: string },
  folder: string
) {
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
  return cloudinary.uploader.upload(
    `data:${file.mimetype};base64,${file.buffer.toString("base64")}`,
    {
      folder: `autosalesreviews/${folder}`,
      resource_type: "image",
    }
  );
}

/** Uploads an admin-supplied image (e.g. blog featured image) to Cloudinary and returns its public URL. */
export async function uploadAdminImage(
  file: { buffer: Buffer; mimetype: string },
  folder: string
): Promise<string> {
  const uploaded = await uploadToCloudinary(file, folder);
  return uploaded.secure_url;
}

/** Same as {@link uploadAdminImage}, but also returns the image's natural
 * dimensions — needed for callers (like inline article images) that render
 * with next/image and must set width/height to avoid layout shift. */
export async function uploadAdminImageWithDimensions(
  file: { buffer: Buffer; mimetype: string },
  folder: string
): Promise<{ url: string; width: number; height: number }> {
  const uploaded = await uploadToCloudinary(file, folder);
  return { url: uploaded.secure_url, width: uploaded.width, height: uploaded.height };
}
