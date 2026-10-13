import { v2 as cloudinary } from "cloudinary";

/**
 * Files we keep on Cloudinary: short-lived signed links, and deletion.
 *
 * The account blocks public delivery of PDF/ZIP files, so plain
 * res.cloudinary.com links return 401 for them. Download links signed with
 * the API secret work for every file type, expire quickly, and are only
 * handed out by routes that have checked who is asking.
 */

export type StoredAsset = {
  publicId: string;
  resourceType: "image" | "raw";
  /** File format for image/PDF assets (e.g. "pdf", "jpg"); raw assets keep it in the public_id. */
  format: string;
};

function configure() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary is not configured.");
  }
  cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
}

/** Reads resource type, public_id and format from a res.cloudinary.com delivery URL. */
export function storedAssetFromUrl(fileUrl: string): StoredAsset | null {
  try {
    const url = new URL(fileUrl);
    const match = url.pathname.match(/\/(image|raw)\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return null;
    const resourceType = match[1] as "image" | "raw";
    const path = decodeURIComponent(match[2]);
    if (resourceType === "raw") return { publicId: path, resourceType, format: "" };
    const dot = path.lastIndexOf(".");
    const slash = path.lastIndexOf("/");
    if (dot <= slash) return { publicId: path, resourceType, format: "jpg" };
    return { publicId: path.slice(0, dot), resourceType, format: path.slice(dot + 1) };
  } catch {
    return null;
  }
}

/** A link valid for a few minutes that opens the file in the browser, or downloads it. */
export function signedDownloadUrl(
  asset: StoredAsset,
  { download = false, expiresInSeconds = 300 }: { download?: boolean; expiresInSeconds?: number } = {},
) {
  configure();
  return cloudinary.utils.private_download_url(
    asset.publicId,
    asset.resourceType === "raw" ? "" : asset.format,
    {
      resource_type: asset.resourceType,
      type: "upload",
      expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
      attachment: download,
    },
  );
}

/** Deletes a stored file. Failures are logged, never thrown. */
export async function deleteStoredAsset(asset: StoredAsset) {
  try {
    configure();
    await cloudinary.uploader.destroy(asset.publicId, {
      resource_type: asset.resourceType,
      invalidate: true,
    });
  } catch (error) {
    console.error("Could not delete stored file:", error);
  }
}
