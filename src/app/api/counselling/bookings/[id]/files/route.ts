import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { getCurrentUser } from "@/lib/auth/session";
import { deleteCounsellingFile } from "@/lib/counselling/cloudinary";
import { STUDENT_FILE_LIMIT, authorizeCounsellingFiles } from "@/lib/counselling/file-access";
import {
  COUNSELLING_FILES_PER_BATCH,
  counsellingFileProblem,
  counsellingFolder,
} from "@/lib/counselling/files";
import { db } from "@/lib/db";
import { discardDirectUpload, isVerifiedDirectUpload } from "@/lib/media/direct-upload";
import { directUploadResultSchema } from "@/lib/media/direct-upload-schema";
import { createUserNotification, notifyActiveAdmins } from "@/lib/notifications/service";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const registerSchema = z.object({
  files: z
    .array(
      z.object({
        fileName: z.string().trim().min(1).max(200),
        upload: directUploadResultSchema,
      }),
    )
    .min(1)
    .max(COUNSELLING_FILES_PER_BATCH),
});

const fileSelect = {
  id: true,
  fileName: true,
  fileUrl: true,
  uploadedByRole: true,
  uploadedById: true,
  uploadedByName: true,
  createdAt: true,
} as const;

export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Please sign in again.", 401);

  const { id } = await context.params;
  const access = await authorizeCounsellingFiles(user, id, "view");
  if (!access.ok) return access.response;

  const files = await db.counsellingFile.findMany({
    where: { bookingId: id },
    orderBy: { createdAt: "desc" },
    select: fileSelect,
  });
  return NextResponse.json({ success: true, data: files });
}

/** Saves files the browser already uploaded to Cloudinary (see ./sign). */
export async function POST(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const user = await getCurrentUser();
  if (!user) return errorResponse("Please sign in again.", 401);

  const { id } = await context.params;
  const access = await authorizeCounsellingFiles(user, id, "upload");
  if (!access.ok) return access.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request.", 400);
  }
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Invalid file details.", 422);

  const folder = counsellingFolder(id);
  const accepted: typeof parsed.data.files = [];
  const problems: string[] = [];

  for (const item of parsed.data.files) {
    // Never delete an unverified upload: its public_id came from the browser.
    if (!isVerifiedDirectUpload(item.upload, folder)) {
      problems.push(`${item.fileName}: the upload could not be verified.`);
      continue;
    }
    const problem = counsellingFileProblem({ name: item.fileName, size: item.upload.bytes });
    if (problem) {
      problems.push(problem);
      after(() => discardDirectUpload(item.upload, folder));
      continue;
    }
    accepted.push(item);
  }

  if (accepted.length === 0) {
    return errorResponse(problems[0] ?? "No files could be shared.", 422);
  }

  if (!access.isStaff) {
    const existing = await db.counsellingFile.count({
      where: { bookingId: id, uploadedById: user.id },
    });
    if (existing + accepted.length > STUDENT_FILE_LIMIT) {
      for (const file of accepted) after(() => discardDirectUpload(file.upload, folder));
      return errorResponse(
        `You can share up to ${STUDENT_FILE_LIMIT} files on one session. Remove an old file first.`,
        409,
      );
    }
  }

  const files = await db.$transaction(
    accepted.map((file) =>
      db.counsellingFile.create({
        data: {
          bookingId: id,
          fileName: file.fileName,
          fileUrl: file.upload.secureUrl,
          fileKey: file.upload.publicId,
          uploadedByRole: user.role === "STUDENT" ? "STUDENT" : "ADMIN",
          uploadedById: user.id,
          uploadedByName: user.fullName,
        },
        select: fileSelect,
      }),
    ),
  );

  // One notification for the whole batch, not one per file.
  const count = files.length;
  const label = count === 1 ? `"${files[0].fileName}"` : `${count} files`;
  const booking = access.booking;
  after(async () => {
    if (access.isStaff) {
      if (!booking.userId) return;
      await createUserNotification({
        userId: booking.userId,
        title: "New file from your counsellor",
        content: `Your counsellor shared ${label} for your Study Plan / Counselling session.`,
        type: "FILE_UPLOADED",
        category: "UPDATE",
        link: "/dashboard?tab=counselling",
      }).catch(console.error);
    } else {
      await notifyActiveAdmins({
        title: "Student shared documents",
        content: `${booking.fullName} shared ${label} for their Study Plan / Counselling session.`,
        type: "FILE_UPLOADED",
        category: "ALERT",
        link: "/admin/counselling",
      }).catch(console.error);
    }
  });

  return NextResponse.json({
    success: true,
    message:
      problems.length > 0
        ? `${count} shared. ${problems.join(" ")}`
        : `${count === 1 ? "File" : `${count} files`} shared.`,
    data: { files, problems },
  });
}

/** Removes a shared file (staff: any file; student: only files they shared). */
export async function DELETE(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const user = await getCurrentUser();
  if (!user) return errorResponse("Please sign in again.", 401);

  const { id } = await context.params;
  const fileId = request.nextUrl.searchParams.get("fileId");
  if (!fileId) return errorResponse("File id is required.", 400);

  const access = await authorizeCounsellingFiles(user, id, "delete");
  if (!access.ok) return access.response;

  const file = await db.counsellingFile.findFirst({
    where: { id: fileId, bookingId: id },
    select: { id: true, fileKey: true, uploadedById: true },
  });
  if (!file) return errorResponse("File not found.", 404);
  if (!access.isStaff && file.uploadedById !== user.id) {
    return errorResponse("You can only remove files you shared.", 403);
  }

  await db.counsellingFile.delete({ where: { id: file.id } });
  after(() => deleteCounsellingFile(file.fileKey).catch(console.error));

  return NextResponse.json({ success: true, message: "File removed." });
}
