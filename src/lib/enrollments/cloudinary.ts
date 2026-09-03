import { createHash } from "node:crypto";

import { v2 as cloudinary } from "cloudinary";

const PAYMENT_PROOF_FOLDER = "broad-academy/payment-proofs";

type CloudinaryConfig = {
  cloud_name: string;
  api_key: string;
  api_secret: string;
};

type UploadResult = {
  public_id: string;
  format: string;
  version: number;
  bytes: number;
};

function getCloudinaryConfig(): CloudinaryConfig {
  const cloud_name = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const api_key = process.env.CLOUDINARY_API_KEY?.trim();
  const api_secret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloud_name || !api_key || !api_secret) {
    throw new Error("Cloudinary is not configured.");
  }

  return { cloud_name, api_key, api_secret };
}

function signCloudinaryParams(
  params: Record<string, string>,
  api_secret: string,
) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");

  return createHash("sha1").update(payload + api_secret).digest("hex");
}

function configureSdk() {
  const config = getCloudinaryConfig();
  cloudinary.config({ ...config, secure: true });
}

async function signedUpload(
  bytes: Uint8Array,
  _mimeType: string,
): Promise<UploadResult> {
  configureSdk();
  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: PAYMENT_PROOF_FOLDER,
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result) {
          return reject(
            new Error(
              error?.message ||
                "Cloudinary upload failed without a result.",
            ),
          );
        }
        resolve({
          public_id: result.public_id,
          format: result.format,
          version: result.version,
          bytes: result.bytes,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

async function signedDestroy(publicId: string) {
  configureSdk();
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch (error) {
    console.error("Cloudinary destroy failed:", error);
  }
}

export async function uploadPaymentProof(
  bytes: Uint8Array,
  mimeType: string,
): Promise<Pick<UploadResult, "public_id" | "format" | "version" | "bytes">> {
  return signedUpload(bytes, mimeType);
}

export async function deletePaymentProof(publicId: string) {
  await signedDestroy(publicId);
}

export function createPaymentProofDownloadUrl(
  publicId: string,
  format: string,
) {
  configureSdk();
  const expiresAt = Math.floor(Date.now() / 1000) + 5 * 60;

  return cloudinary.url(`${publicId}.${format}`, {
    resource_type: "image",
    type: "upload",
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
  });
}
