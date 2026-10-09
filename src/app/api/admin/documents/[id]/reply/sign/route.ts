import { NextRequest, NextResponse } from "next/server";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { documentFileProblem, documentReplyFolder } from "@/lib/documents/files";
import { createDirectUploadTickets } from "@/lib/media/direct-upload";
import { directUploadRequestSchema } from "@/lib/media/direct-upload-schema";

export const runtime = "nodejs";

/** Signs the upload of a reply attachment (the file goes straight to Cloudinary). */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.DOCUMENTS);
  if (error) return error;

  const { id } = await context.params;
  const document = await db.documentSubmission.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!document) return errorResponse("Document not found.", 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request.", 400);
  }
  const parsed = directUploadRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Choose a file to attach.", 422);

  const problem = documentFileProblem(parsed.data);
  if (problem) return errorResponse(problem, 422);

  try {
    const tickets = createDirectUploadTickets(documentReplyFolder(id), [parsed.data.name]);
    return NextResponse.json(
      { success: true, data: { tickets } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (signError) {
    console.error("Could not sign reply attachment upload:", signError);
    return errorResponse("Uploads are not available right now. Please try again later.", 503);
  }
}
