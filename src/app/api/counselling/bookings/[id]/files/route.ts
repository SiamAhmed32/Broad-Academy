import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { getCurrentUser } from "@/lib/auth/session";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { uploadCounsellingFile } from "@/lib/counselling/cloudinary";
import { createUserNotification, notifyActiveAdmins } from "@/lib/notifications/service";

type RouteContext = { params: Promise<{ id: string }> };

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

const ALLOWED_MIME_TYPES = new Set([
  // Images
  "image/jpeg",
  "image/png",
  "image/webp",
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  "application/x-rar-compressed",
]);

export async function GET(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  const { id } = await context.params;

  // Find booking
  const booking = await db.counsellingBooking.findUnique({
    where: { id },
  });

  if (!booking) {
    return errorResponse("Booking not found.", 404);
  }
  // Authorization check
  if (user.role === "STUDENT") {
    const isOwner = booking.userId === user.id || booking.email === user.email;
    if (!isOwner) {
      return errorResponse("You are not authorized to view files for this booking.", 403);
    }
  }

  const files = await db.counsellingFile.findMany({
    where: { bookingId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ success: true, data: files });
}

export async function POST(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const user = await getCurrentUser();
  if (!user) {
    return errorResponse("Authentication required.", 401);
  }

  const { id } = await context.params;

  // Find booking
  const booking = await db.counsellingBooking.findUnique({
    where: { id },
  });

  if (!booking) {
    return errorResponse("Booking not found.", 404);
  }
  if (booking.archivedAt) {
    return errorResponse(
      "Archived sessions are read-only. Restore the session before uploading files.",
      409,
    );
  }

  // Authorization check
  if (user.role === "STUDENT") {
    const isOwner = booking.userId === user.id || booking.email === user.email;
    if (!isOwner) {
      return errorResponse("You are not authorized to upload files for this booking.", 403);
    }
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid upload request.", 400);
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return errorResponse("Choose a file to upload.", 422);
  }

  if (file.size === 0 || file.size > MAX_FILE_SIZE_BYTES) {
    return errorResponse("File must be 10 MB or smaller.", 422);
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return errorResponse("File type not supported. Allowed: PDF, Word, TXT, ZIP, JPEG, PNG, WebP.", 422);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  
  try {
    const uploadResult = await uploadCounsellingFile(bytes, file.name, file.type);
    
    // Save to DB
    const counsellingFile = await db.counsellingFile.create({
      data: {
        bookingId: id,
        fileName: file.name,
        fileUrl: uploadResult.secure_url,
        fileKey: uploadResult.public_id,
        uploadedByRole: user.role,
        uploadedById: user.id,
        uploadedByName: user.fullName,
      },
    });

    // Handle notifications
    if (user.role === "STUDENT") {
      void notifyActiveAdmins({
        title: "New student file uploaded",
        content: `${user.fullName} uploaded a file for their counselling session on ${booking.preferredDate.toLocaleDateString()}.`,
        type: "FILE_UPLOADED",
        category: "ALERT",
        link: "/admin/counselling",
      }).catch(() => undefined);
    } else if (booking.userId) {
      void createUserNotification({
        userId: booking.userId,
        title: "New counselling document shared",
        content: `Your academic advisor shared a file: "${file.name}" for your session.`,
        type: "FILE_UPLOADED",
        category: "UPDATE",
        link: "/dashboard?tab=counselling",
      }).catch(() => undefined);
    }

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully!",
      data: counsellingFile,
    });
  } catch (error) {
    console.error("Counselling file upload error:", error);
    return errorResponse("Failed to upload file. Please try again.", 502);
  }
}
