import multer from "multer";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/** In-memory storage — the buffer is streamed straight to Cloudinary, never written to disk. */
export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES },
}).single("image");
