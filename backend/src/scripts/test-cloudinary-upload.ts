import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";

async function main() {
  cloudinary.config(true);
  console.log("cloud_name:", cloudinary.config().cloud_name);

  // 1x1 transparent PNG
  const tinyPng =
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  try {
    const res = await cloudinary.uploader.upload(tinyPng, {
      folder: "autosalesreviews/_diag",
      public_id: `probe_${Date.now()}`,
      overwrite: true,
      resource_type: "image",
    });
    console.log("UPLOAD OK:", res.secure_url);
  } catch (e) {
    console.log("UPLOAD FAILED:");
    console.log(JSON.stringify(e, Object.getOwnPropertyNames(e), 2));
  }

  try {
    const usage = await cloudinary.api.usage();
    console.log("\nACCOUNT USAGE:");
    console.log(JSON.stringify(usage, null, 2));
  } catch (e) {
    console.log("usage() failed:", (e as Error).message);
  }
}

main();
