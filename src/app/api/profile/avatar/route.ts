import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  deleteStudentAvatar,
  uploadStudentAvatar,
} from "@/lib/students/avatar";
import { hasActiveEnrollment } from "@/lib/students/access";

export const runtime = "nodejs";

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

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

export async function POST(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return errorResponse("Unauthorized.", 401);
  }

  const enrolled = await hasActiveEnrollment(user.id);
  if (!enrolled) {
    return errorResponse("Profile photo is available after your first enrollment is approved.", 403);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid form data.");
  }

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return errorResponse("Choose a profile photo to upload.", 422);
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return errorResponse("Profile photo must be 2 MB or smaller.", 422);
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return errorResponse("Upload a JPG, PNG, or WebP image.", 422);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasValidImageSignature(bytes, file.type)) {
    return errorResponse("The image file is not valid.", 422);
  }

  const existing = await db.user.findUnique({
    where: { id: user.id },
    select: { avatarPublicId: true },
  });

  if (existing?.avatarPublicId) {
    await deleteStudentAvatar(existing.avatarPublicId).catch(console.error);
  }

  let uploaded: Awaited<ReturnType<typeof uploadStudentAvatar>>;
  try {
    uploaded = await uploadStudentAvatar(bytes, file.type, user.id);
  } catch (error) {
    console.error("Avatar upload failed:", error);
    return errorResponse("Could not upload profile photo.", 502);
  }

  const updated = await db.user.update({
    where: { id: user.id },
    data: {
      avatarUrl: uploaded.secure_url,
      avatarPublicId: uploaded.public_id,
    },
    select: {
      avatarUrl: true,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Profile photo updated.",
    data: updated,
  });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user || user.role !== "STUDENT") {
    return errorResponse("Unauthorized.", 401);
  }

  const existing = await db.user.findUnique({
    where: { id: user.id },
    select: { avatarPublicId: true },
  });

  if (existing?.avatarPublicId) {
    await deleteStudentAvatar(existing.avatarPublicId).catch(console.error);
  }

  await db.user.update({
    where: { id: user.id },
    data: { avatarUrl: null, avatarPublicId: null },
  });

  return NextResponse.json({ success: true, message: "Profile photo removed." });
}
