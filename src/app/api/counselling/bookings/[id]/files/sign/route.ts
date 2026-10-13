import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { getCurrentUser } from "@/lib/auth/session";
import { STUDENT_FILE_LIMIT, authorizeCounsellingFiles } from "@/lib/counselling/file-access";
import {
  COUNSELLING_FILES_PER_BATCH,
  counsellingFileProblem,
  counsellingFolder,
} from "@/lib/counselling/files";
import { db } from "@/lib/db";
import { createDirectUploadTickets } from "@/lib/media/direct-upload";

export const runtime = "nodejs";

type RouteContext = { params: Promise<{ id: string }> };

const signSchema = z.object({
  files: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(200),
        size: z.coerce.number().int().min(0),
      }),
    )
    .min(1)
    .max(COUNSELLING_FILES_PER_BATCH),
});

/** Signs browser uploads into this session's folder (files go straight to Cloudinary). */
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
  const parsed = signSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Choose up to 10 files to share.", 422);

  // Reject unsupported or oversized files before anything is uploaded.
  for (const file of parsed.data.files) {
    const problem = counsellingFileProblem(file);
    if (problem) return errorResponse(problem, 422);
  }

  if (!access.isStaff) {
    const existing = await db.counsellingFile.count({
      where: { bookingId: id, uploadedById: user.id },
    });
    if (existing + parsed.data.files.length > STUDENT_FILE_LIMIT) {
      return errorResponse(
        `You can share up to ${STUDENT_FILE_LIMIT} files on one session. Remove an old file first.`,
        409,
      );
    }
  }

  try {
    const tickets = createDirectUploadTickets(
      counsellingFolder(id),
      parsed.data.files.map((file) => file.name),
    );
    return NextResponse.json(
      { success: true, data: { tickets } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not sign counselling upload:", error);
    return errorResponse("File uploads are not available right now.", 503);
  }
}
