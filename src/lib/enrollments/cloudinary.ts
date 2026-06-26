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
  mimeType: string,
): Promise<UploadResult> {
  const { cloud_name, api_key, api_secret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = {
    folder: PAYMENT_PROOF_FOLDER,
    timestamp: String(timestamp),
  };
  const signature = signCloudinaryParams(signParams, api_secret);
  const uploadBuffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

  const form = new FormData();
  form.append(
    "file",
    new Blob([uploadBuffer], { type: mimeType }),
    "payment-proof",
  );
  form.append("api_key", api_key);
  form.append("timestamp", String(timestamp));
  form.append("folder", PAYMENT_PROOF_FOLDER);
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud_name)}/image/upload`,
    {
      method: "POST",
      body: form,
      cache: "no-store",
    },
  );

  const result = (await response.json().catch(() => null)) as {
    public_id?: string;
    format?: string;
    version?: number;
    bytes?: number;
    error?: { message?: string };
  } | null;

  if (!response.ok || !result?.public_id || !result.format) {
    throw new Error(
      result?.error?.message ||
        `Cloudinary upload failed with status ${response.status}.`,
    );
  }

  return {
    public_id: result.public_id,
    format: result.format,
    version: result.version ?? 0,
    bytes: result.bytes ?? bytes.byteLength,
  };
}

async function signedDestroy(publicId: string) {
  const { cloud_name, api_key, api_secret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = {
    public_id: publicId,
    timestamp: String(timestamp),
  };
  const signature = signCloudinaryParams(signParams, api_secret);

  const form = new FormData();
  form.append("public_id", publicId);
  form.append("api_key", api_key);
  form.append("timestamp", String(timestamp));
  form.append("signature", signature);

  await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud_name)}/image/destroy`,
    {
      method: "POST",
      body: form,
      cache: "no-store",
    },
  );
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
