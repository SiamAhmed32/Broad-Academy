import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { deleteDocumentFile } from "@/lib/documents/cloudinary";
import {
  documentFileProblem,
  documentReplyFolder,
  isDocumentAsset,
} from "@/lib/documents/files";
import { notifyStudentAboutDocument } from "@/lib/documents/notify";
import { pickDocumentFile } from "@/lib/documents/stream";
import { discardDirectUpload, isVerifiedDirectUpload } from "@/lib/media/direct-upload";
import { directUploadResultSchema } from "@/lib/media/direct-upload-schema";

export const runtime = "nodejs";

const replySchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "APPROVED", "REJECTED"]),
  reviewNote: z.string().trim().max(2000),
  removeFile: z.boolean().default(false),
  /** A new attachment the browser already uploaded (see ./sign). */
  attachment: z
    .object({
      fileName: z.string().trim().min(1).max(200),
      upload: directUploadResultSchema,
    })
    .nullable()
    .optional(),
});

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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request.", 400);
  }

  const parsed = replySchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Please review the reply.", 422, parsed.error.flatten().fieldErrors);
  }

  const { attachment } = parsed.data;
  const folder = documentReplyFolder(id);
  // discardDirectUpload only deletes uploads that verify for this folder.
  const discardAttachment = () => {
    if (attachment) after(() => discardDirectUpload(attachment.upload, folder));
  };

  const existing = await db.documentSubmission.findUnique({ where: { id } });
  if (!existing) {
    discardAttachment();
    return errorResponse("Document not found.", 404);
  }

  let fileData: {
    replyFileUrl: string | null;
    replyFilePublicId: string | null;
    replyFileName: string | null;
    replyFileFormat: string | null;
    replyFileResourceType: string | null;
  } | null = null;

  if (attachment) {
    const { upload, fileName } = attachment;
    if (!isVerifiedDirectUpload(upload, folder)) {
      return errorResponse("The attachment could not be verified. Please attach it again.", 422);
    }
    const problem =
      documentFileProblem({ name: fileName, size: upload.bytes }) ??
      (isDocumentAsset(upload) ? null : "This file is not a readable PDF or image.");
    if (problem) {
      discardAttachment();
      return errorResponse(problem, 422);
    }
    fileData = {
      replyFileUrl: upload.secureUrl,
      replyFilePublicId: upload.publicId,
      replyFileName: fileName,
      replyFileFormat: upload.format ?? null,
      replyFileResourceType: upload.resourceType,
    };
  } else if (parsed.data.removeFile) {
    fileData = {
      replyFileUrl: null,
      replyFilePublicId: null,
      replyFileName: null,
      replyFileFormat: null,
      replyFileResourceType: null,
    };
  }

  const reviewNote = parsed.data.reviewNote || null;
  const replyChanged =
    reviewNote !== existing.reviewNote || Boolean(fileData?.replyFileUrl);

  const document = await db.documentSubmission.update({
    where: { id },
    data: {
      status: parsed.data.status,
      reviewNote,
      reviewedAt: new Date(),
      ...(fileData ?? {}),
    },
  });

  // The previous attachment was replaced or removed, so nothing points to it.
  const previousFile = fileData ? pickDocumentFile(existing, "reply") : null;
  if (previousFile) after(() => deleteDocumentFile(previousFile));

  if (replyChanged || parsed.data.status !== existing.status) {
    const replied = Boolean(replyChanged && (reviewNote || document.replyFileUrl));
    after(() =>
      notifyStudentAboutDocument(document, { replied }).catch(console.error),
    );
  }

  return NextResponse.json(
    { success: true, message: "Reply saved and student notified.", data: document },
    { headers: { "Cache-Control": "no-store" } },
  );
}
