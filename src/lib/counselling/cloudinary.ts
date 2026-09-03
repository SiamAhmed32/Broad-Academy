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
  _fileName: string,
  _mimeType: string,
): Promise<UploadResult> {
  const { cloud_name, api_key, api_secret } = getCloudinaryConfig();
  cloudinary.config({
    cloud_name,
    api_key,
    api_secret,
    secure: true,
  });

  const buffer = Buffer.from(bytes);

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: COUNSELLING_FILES_FOLDER,
        resource_type: "auto",
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
          format: result.format ?? "",
          version: result.version ?? 0,
          bytes: result.bytes ?? bytes.byteLength,
          secure_url: result.secure_url,
        });
      },
    );

    uploadStream.end(buffer);
  });
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
