import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { uploadDocumentSubmission } from "@/lib/documents/cloudinary";
import { notifyStudentAboutDocument } from "@/lib/documents/notify";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const replySchema = z.object({
  status: z.enum(["PENDING", "REVIEWED", "APPROVED", "REJECTED"]),
  reviewNote: z.string().trim().max(2000),
  removeFile: z.enum(["0", "1"]).default("0"),
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

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return errorResponse("Invalid form submission.", 400);
  }

  const parsed = replySchema.safeParse({
    status: formData.get("status"),
    reviewNote: formData.get("reviewNote") ?? "",
    removeFile: formData.get("removeFile") ?? "0",
  });
  if (!parsed.success) {
    return errorResponse("Please review the reply.", 422, parsed.error.flatten().fieldErrors);
  }

  const existing = await db.documentSubmission.findUnique({ where: { id } });
  if (!existing) return errorResponse("Document not found.", 404);

  const file = formData.get("file");
  let fileData: {
    replyFileUrl: string | null;
    replyFilePublicId: string | null;
    replyFileName: string | null;
    replyFileFormat: string | null;
    replyFileResourceType: string | null;
  } | null = null;

  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_FILE_BYTES) {
      return errorResponse("Attachment must be 8 MB or smaller.", 422);
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return errorResponse("Attach a JPG, PNG, WebP, or PDF file.", 422);
    }
    try {
      const upload = await uploadDocumentSubmission(
        new Uint8Array(await file.arrayBuffer()),
        file.type,
        file.name,
      );
      fileData = {
        replyFileUrl: upload.secure_url,
        replyFilePublicId: upload.public_id,
        replyFileName: file.name,
        replyFileFormat: upload.format,
        replyFileResourceType: upload.resource_type,
      };
    } catch (uploadError) {
      console.error("Reply attachment upload failed:", uploadError);
      return errorResponse("Could not upload the attachment. Please try again.", 502);
    }
  } else if (parsed.data.removeFile === "1") {
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
