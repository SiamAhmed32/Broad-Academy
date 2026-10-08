import { NextRequest } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import {
  documentFileSelect,
  pickDocumentFile,
  streamDocumentFile,
} from "@/lib/documents/stream";
import { studentDocumentsWhere } from "@/lib/documents/student";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const user = await getCurrentUser();
  if (!user) return errorResponse("Authentication required.", 401);

  const { id } = await context.params;
  const download = request.nextUrl.searchParams.get("download") === "1";
  const which =
    request.nextUrl.searchParams.get("which") === "reply" ? "reply" : "original";

  // Students can only open files from their own submissions.
  const document = await db.documentSubmission.findFirst({
    where: { id, ...studentDocumentsWhere(user) },
    select: documentFileSelect,
  });

  const file = document ? pickDocumentFile(document, which) : null;
  if (!file) return errorResponse("Document file not found.", 404);

  return streamDocumentFile(file, download);
}
