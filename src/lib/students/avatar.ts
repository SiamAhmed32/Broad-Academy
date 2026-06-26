import { createHash } from "node:crypto";

const AVATAR_FOLDER = "broad-academy/student-avatars";

type CloudinaryConfig = {
  cloud_name: string;
  api_key: string;
  api_secret: string;
};

type UploadResult = {
  public_id: string;
  format: string;
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

export async function uploadStudentAvatar(
  bytes: Uint8Array,
  mimeType: string,
  userId: string,
): Promise<UploadResult> {
  const { cloud_name, api_key, api_secret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = {
    folder: AVATAR_FOLDER,
    public_id: `student-${userId}`,
    overwrite: "true",
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
    "avatar",
  );
  form.append("api_key", api_key);
  form.append("timestamp", String(timestamp));
  form.append("folder", AVATAR_FOLDER);
  form.append("public_id", signParams.public_id);
  form.append("overwrite", "true");
  form.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloud_name)}/image/upload`,
    { method: "POST", body: form, cache: "no-store" },
  );

  const result = (await response.json().catch(() => null)) as {
    public_id?: string;
    format?: string;
    secure_url?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok || !result?.public_id || !result.secure_url) {
    throw new Error(result?.error?.message ?? "Avatar upload failed.");
  }

  return {
    public_id: result.public_id,
    format: result.format ?? "jpg",
    secure_url: result.secure_url,
  };
}

export async function deleteStudentAvatar(publicId: string) {
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
    { method: "POST", body: form, cache: "no-store" },
  );
}
