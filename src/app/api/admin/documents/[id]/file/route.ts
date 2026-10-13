import { NextRequest } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { errorResponse } from "@/lib/auth/response";
import { db } from "@/lib/db";
import {
  documentFileSelect,
  pickDocumentFile,
  documentFileResponse,
} from "@/lib/documents/stream";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.DOCUMENTS);
  if (error) return error;

  const { id } = await context.params;
  const download = request.nextUrl.searchParams.get("download") === "1";
  const which =
    request.nextUrl.searchParams.get("which") === "reply" ? "reply" : "original";

  const document = await db.documentSubmission.findUnique({
    where: { id },
    select: documentFileSelect,
  });

  const file = document ? pickDocumentFile(document, which) : null;
  if (!file) return errorResponse("Document file not found.", 404);

  return documentFileResponse(file, download);
}
