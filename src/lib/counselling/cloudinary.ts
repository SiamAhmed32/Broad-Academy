import { createHash } from "node:crypto";
import { v2 as cloudinary } from "cloudinary";

const COUNSELLING_FILES_FOLDER = "broad-academy/counselling-files";

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
  secure_url: string;
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

export async function uploadCounsellingFile(
  bytes: Uint8Array,
  fileName: string,
  mimeType: string,
): Promise<UploadResult> {
  const { cloud_name, api_key, api_secret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = {
    folder: COUNSELLING_FILES_FOLDER,
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
    fileName,
  );
  form.append("api_key", api_key);
  form.append("timestamp", String(timestamp));
  form.append("folder", COUNSELLING_FILES_FOLDER);
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud_name)}/auto/upload`,
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
    secure_url?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok || !result?.public_id || !result.secure_url) {
    throw new Error(
      result?.error?.message ||
        `Cloudinary upload failed with status ${response.status}.`,
    );
  }

  return {
    public_id: result.public_id,
    format: result.format ?? "",
    version: result.version ?? 0,
    bytes: result.bytes ?? bytes.byteLength,
    secure_url: result.secure_url,
  };
}

export async function deleteCounsellingFile(publicId: string) {
  const { cloud_name, api_key, api_secret } = getCloudinaryConfig();
  
  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });

  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
  } catch {
    // ignore
  }
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
  } catch {
    // ignore
  }
}
