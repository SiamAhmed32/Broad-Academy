import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import { v2 as cloudinary } from "cloudinary";

/**
 * Browser-to-Cloudinary uploads.
 *
 * Vercel functions reject request bodies over ~4.5 MB, so larger files cannot
 * pass through our API routes. Instead the server signs one upload per file
 * with an exact public_id inside a folder path it controls, the browser sends
 * the file straight to Cloudinary, and the server verifies Cloudinary's
 * response signature before saving anything. Signing the public_id (rather
 * than relying on the `folder` option) works the same with Cloudinary's fixed
 * and dynamic folder modes.
 */

export type DirectUploadTicket = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  publicId: string;
};

/** The fields of Cloudinary's upload response the browser sends back to us. */
export type DirectUploadResult = {
  publicId: string;
  version: number;
  signature: string;
  resourceType: string;
  format?: string | null;
  bytes: number;
  secureUrl: string;
};

// Cloudinary stores PDFs and images as "image" assets (format added to the
// URL); anything else becomes a "raw" asset whose public_id must keep its
// extension so downloads open with the right app.
const IMAGE_LIKE = new Set(["pdf", "jpg", "jpeg", "png", "webp", "gif"]);

function credentials() {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();
  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary is not configured.");
  }
  return { cloud_name, api_key, api_secret };
}

/** Cloudinary request signing: sorted `key=value` pairs joined by `&`, plus the secret. */
function sign(
  params: Record<string, string | number>,
  secret: string,
  algorithm: "sha1" | "sha256" = "sha1",
) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash(algorithm).update(payload + secret).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

/** Signs one upload per file name, each into its own public_id under `folder`. */
export function createDirectUploadTickets(folder: string, fileNames: string[]): DirectUploadTicket[] {
  const { cloud_name, api_key, api_secret } = credentials();
  const timestamp = Math.floor(Date.now() / 1000);
  return fileNames.map((name) => {
    const extension = name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? "";
    const id = randomBytes(10).toString("hex");
    const publicId = `${folder}/${id}${extension && !IMAGE_LIKE.has(extension) ? `.${extension}` : ""}`;
    return {
      cloudName: cloud_name,
      apiKey: api_key,
      timestamp,
      signature: sign({ public_id: publicId, timestamp }, api_secret),
      publicId,
    };
  });
}

/**
 * True when the result genuinely came from a Cloudinary upload into `folder`
 * of our account. Cloudinary's response signature covers public_id and
 * version, and only the server chooses public_ids, so neither can be forged.
 */
export function isVerifiedDirectUpload(result: DirectUploadResult, folder: string) {
  const { cloud_name, api_secret } = credentials();
  if (!result.publicId.startsWith(`${folder}/`)) return false;
  if (!["image", "raw"].includes(result.resourceType)) return false;

  const params = { public_id: result.publicId, version: result.version };
  const signed =
    safeEqual(result.signature, sign(params, api_secret, "sha1")) ||
    safeEqual(result.signature, sign(params, api_secret, "sha256"));
  if (!signed) return false;

  const expectedPrefix = `https://res.cloudinary.com/${cloud_name}/${result.resourceType}/upload/v${result.version}/${result.publicId}`;
  return result.secureUrl.startsWith(expectedPrefix);
}

/**
 * Deletes an upload we decided not to keep. It re-verifies the result first:
 * the public_id comes from the browser, so an unverified one could name
 * somebody else's file.
 */
export async function discardDirectUpload(result: DirectUploadResult, folder: string) {
  try {
    if (!isVerifiedDirectUpload(result, folder)) return;
    const { cloud_name, api_key, api_secret } = credentials();
    cloudinary.config({ cloud_name, api_key, api_secret, secure: true });
    await cloudinary.uploader.destroy(result.publicId, {
      resource_type: result.resourceType === "raw" ? "raw" : "image",
      invalidate: true,
    });
  } catch (error) {
    console.error("Could not discard upload:", error);
  }
}
