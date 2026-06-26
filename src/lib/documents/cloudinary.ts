import { createHash } from "node:crypto";

import { v2 as cloudinary } from "cloudinary";

const DOCUMENT_FOLDER = "broad-academy/document-submissions";

type CloudinaryConfig = {
  cloud_name: string;
  api_key: string;
  api_secret: string;
};

export type DocumentUploadResult = {
  secure_url: string;
  public_id: string;
  format: string;
  resource_type: "image" | "raw";
  bytes: number;
};

export type DocumentFileRecord = {
  fileUrl: string;
  filePublicId?: string | null;
  fileFormat?: string | null;
  fileName?: string | null;
  fileResourceType?: string | null;
  documentType?: string;
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

function configureSdk() {
  cloudinary.config({ ...getCloudinaryConfig(), secure: true });
}

function signCloudinaryParams(params: Record<string, string>, api_secret: string) {
  const payload = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${payload}${api_secret}`).digest("hex");
}

function sanitizeDownloadName(value: string) {
  const cleaned = value.replace(/[^\w.\-() ]+/g, "_").trim();
  return cleaned.slice(0, 120) || "document";
}

function parseCloudinaryAsset(fileUrl: string) {
  try {
    const url = new URL(fileUrl);
    const match = url.pathname.match(/\/(image|raw)\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return null;

    const resourceType = match[1] as "image" | "raw";
    const encodedPath = decodeURIComponent(match[2]);
    const lastSlash = encodedPath.lastIndexOf("/");
    const lastDot = encodedPath.lastIndexOf(".");
    const hasExtension = lastDot > lastSlash;

    if (resourceType === "raw") {
      return {
        publicId: encodedPath,
        format: hasExtension ? encodedPath.slice(lastDot + 1) : "pdf",
        resourceType,
      };
    }

    if (!hasExtension) {
      return {
        publicId: encodedPath,
        format: "jpg",
        resourceType,
      };
    }

    return {
      publicId: encodedPath.slice(0, lastDot),
      format: encodedPath.slice(lastDot + 1),
      resourceType,
    };
  } catch {
    return null;
  }
}

function resolveAsset(document: DocumentFileRecord) {
  if (document.filePublicId) {
    return {
      publicId: document.filePublicId,
      format:
        document.fileFormat ??
        (document.fileResourceType === "raw" ? "pdf" : "jpg"),
      resourceType:
        (document.fileResourceType as "image" | "raw" | null) ?? "image",
    };
  }

  return parseCloudinaryAsset(document.fileUrl);
}

export async function uploadDocumentSubmission(
  bytes: Uint8Array,
  mimeType: string,
  originalFileName?: string,
): Promise<DocumentUploadResult> {
  const { cloud_name, api_key, api_secret } = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000);
  const signParams = {
    folder: DOCUMENT_FOLDER,
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
    originalFileName ?? "document",
  );
  form.append("api_key", api_key);
  form.append("timestamp", String(timestamp));
  form.append("folder", DOCUMENT_FOLDER);
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
    secure_url?: string;
    public_id?: string;
    format?: string;
    resource_type?: "image" | "raw";
    bytes?: number;
    error?: { message?: string };
  } | null;

  if (!response.ok || !result?.secure_url || !result.public_id) {
    throw new Error(
      result?.error?.message ||
        `Cloudinary upload failed with status ${response.status}.`,
    );
  }

  return {
    secure_url: result.secure_url,
    public_id: result.public_id,
    format: result.format ?? (mimeType === "application/pdf" ? "pdf" : "jpg"),
    resource_type: result.resource_type ?? "image",
    bytes: result.bytes ?? bytes.byteLength,
  };
}

export function resolveDocumentAccess(
  document: DocumentFileRecord,
  options: { download?: boolean } = {},
) {
  configureSdk();

  const asset = resolveAsset(document);
  if (!asset?.publicId) {
    return document.fileUrl;
  }

  const expiresAt = Math.floor(Date.now() / 1000) + 15 * 60;
  const downloadName =
    document.fileName ||
    (document.documentType
      ? `${sanitizeDownloadName(document.documentType)}.${asset.format}`
      : `document.${asset.format}`);

  const deliveryId =
    asset.resourceType === "raw"
      ? asset.publicId
      : (asset.publicId.includes(".")
          ? asset.publicId
          : `${asset.publicId}.${asset.format}`);

  return cloudinary.url(deliveryId, {
    resource_type: asset.resourceType,
    type: "upload",
    sign_url: true,
    secure: true,
    expires_at: expiresAt,
    ...(options.download
      ? {
          flags: "attachment",
          attachment: sanitizeDownloadName(downloadName),
        }
      : {}),
  });
}

export { signCloudinaryParams, getCloudinaryConfig };
