import { v2 as cloudinary } from "cloudinary";

// Counselling files are uploaded from the browser straight to Cloudinary
// (see lib/media/direct-upload.ts); the server only removes them.

function configure() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary is not configured.");
  }

  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
}

/** Deletes a shared file. PDFs and images are "image" assets, other documents "raw". */
export async function deleteCounsellingFile(publicId: string) {
  configure();
  for (const resource_type of ["image", "raw"] as const) {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type });
    } catch {
      // Not stored under this resource type.
    }
  }
}
