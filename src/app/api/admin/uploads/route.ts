import { createHash } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffApi } from "@/lib/admin/guard";
import {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
  type AdminPermission,
} from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_IMAGE_BYTES + 512 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const uploadPurposeSchema = z.enum([
  "course-thumbnail",
  "instructor-avatar",
  "instructor-cover",
  "testimonial-avatar",
  "campaign-image",
  "exam-banner",
  "exam-question-image",
]);

type UploadPurpose = z.infer<typeof uploadPurposeSchema>;

const uploadConfig: Record<
  UploadPurpose,
  { folder: string; permission: AdminPermission }
> = {
  "course-thumbnail": {
    folder: "broad-academy/course-thumbnails",
    permission: ADMIN_PERMISSIONS.COURSES,
  },
  "instructor-avatar": {
    folder: "broad-academy/instructor-avatars",
    permission: ADMIN_PERMISSIONS.INSTRUCTORS,
  },
  "instructor-cover": {
    folder: "broad-academy/instructor-covers",
    permission: ADMIN_PERMISSIONS.INSTRUCTORS,
  },
  "testimonial-avatar": {
    folder: "broad-academy/testimonial-avatars",
    permission: ADMIN_PERMISSIONS.TESTIMONIALS,
  },
  "campaign-image": {
    folder: "broad-academy/popup-campaigns",
    permission: ADMIN_PERMISSIONS.NOTICES,
  },
  "exam-banner": {
    folder: "broad-academy/exam-banners",
    permission: ADMIN_PERMISSIONS.EXAMS,
  },
  "exam-question-image": {
    folder: "broad-academy/exam-question-images",
    permission: ADMIN_PERMISSIONS.EXAMS,
  },
};

function hasValidImageSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (mimeType === "image/png") {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return png.every((byte, index) => bytes[index] === byte);
  }

  if (mimeType === "image/webp") {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }

  return false;
}

function safeFileName(name: string) {
  const cleaned = name
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .slice(0, 100);
  return cleaned || "image";
}

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { user, error } = await requireStaffApi();
  if (error || !user) return error!;

  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return errorResponse("Image must be 5 MB or smaller.", 413);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid upload request.", 400);
  }

  const parsedPurpose = uploadPurposeSchema.safeParse(formData.get("purpose"));
  if (!parsedPurpose.success) {
    return errorResponse("Invalid image destination.", 422);
  }

  const config = uploadConfig[parsedPurpose.data];
  if (!hasAdminPermission(user, config.permission)) {
    return errorResponse("You do not have permission to upload this image.", 403);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return errorResponse("Choose an image to upload.", 422);
  }

  if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
    return errorResponse("Image must be between 1 byte and 5 MB.", 422);
  }

  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return errorResponse("Only JPG, PNG, and WebP images are allowed.", 422);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidImageSignature(bytes, file.type)) {
    return errorResponse("The selected file is not a valid image.", 422);
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return errorResponse("Image storage is not configured.", 503);
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signature = createHash("sha1")
    .update(`folder=${config.folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  const cloudinaryForm = new FormData();
  cloudinaryForm.append("file", new Blob([bytes], { type: file.type }), safeFileName(file.name));
  cloudinaryForm.append("api_key", apiKey);
  cloudinaryForm.append("timestamp", String(timestamp));
  cloudinaryForm.append("folder", config.folder);
  cloudinaryForm.append("signature", signature);

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      {
        method: "POST",
        body: cloudinaryForm,
        cache: "no-store",
      },
    );
  } catch {
    return errorResponse("Image storage is temporarily unavailable.", 502);
  }

  const result = (await uploadResponse.json().catch(() => null)) as {
    secure_url?: string;
    public_id?: string;
    width?: number;
    height?: number;
    bytes?: number;
  } | null;

  if (
    !uploadResponse.ok ||
    !result?.secure_url ||
    !result.public_id ||
    !result.secure_url.startsWith(`https://res.cloudinary.com/${cloudName}/`)
  ) {
    return errorResponse("The image could not be uploaded. Please try again.", 502);
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        bytes: result.bytes,
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
