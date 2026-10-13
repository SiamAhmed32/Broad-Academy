import { NextRequest, NextResponse, after } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/lib/auth/response";
import { getCurrentUser } from "@/lib/auth/session";
import {
  checkRateLimit,
  getClientIp,
  hashValue,
  isTrustedOrigin,
  recordFailedAttempt,
} from "@/lib/auth/security";
import { db } from "@/lib/db";
import {
  documentFileProblem,
  isDocumentAsset,
  studentDocumentFolder,
} from "@/lib/documents/files";
import { hasActiveEnrollment } from "@/lib/documents/student";
import { documentSubmissionSchema } from "@/lib/documents/validation";
import { discardDirectUpload, isVerifiedDirectUpload } from "@/lib/media/direct-upload";
import { directUploadResultSchema } from "@/lib/media/direct-upload-schema";
import { notifyActiveAdmins } from "@/lib/notifications/service";

export const runtime = "nodejs";

const submitSchema = documentSubmissionSchema.extend({
  fileName: z.string().trim().min(1).max(200),
  upload: directUploadResultSchema,
});

/** Saves a document the browser already uploaded to Cloudinary (see ../sign). */
export async function POST(request: NextRequest) {
  try {
    if (!isTrustedOrigin(request)) {
      return errorResponse("Request origin could not be verified.", 403);
    }

    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return errorResponse("Sign in with a student account to submit documents.", 401);
    }

    if (!(await hasActiveEnrollment(user.id))) {
      return errorResponse("Document submission opens after you enroll in a course.", 403);
    }

    const ipHash = hashValue(getClientIp(request));
    const rateKey = hashValue(`documents:${user.id}:${ipHash}`);
    const rateLimit = await checkRateLimit(rateKey);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: "Too many submissions. Please wait and try again." },
        { status: 429, headers: { "Retry-After": String(rateLimit.retryAfter) } },
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return errorResponse("Invalid form submission.", 400);
    }

    const folder = studentDocumentFolder(user.id);
    // A rejected submission must not leave its file behind in storage.
    // discardDirectUpload only deletes uploads that verify for this folder.
    const discardUpload = () => {
      const upload = directUploadResultSchema.safeParse(
        (body as { upload?: unknown } | null)?.upload,
      );
      if (upload.success) after(() => discardDirectUpload(upload.data, folder));
    };

    const parsed = submitSchema.safeParse(body);
    if (!parsed.success) {
      discardUpload();
      if ((body as { website?: string } | null)?.website) {
        return NextResponse.json({ success: true, message: "Thank you." });
      }
      return errorResponse(
        "Please review the highlighted fields.",
        422,
        parsed.error.flatten().fieldErrors,
      );
    }

    const { upload, fileName, ...fields } = parsed.data;

    if (!isVerifiedDirectUpload(upload, folder)) {
      return errorResponse("The upload could not be verified. Please try again.", 422, {
        document: ["Please choose the file again."],
      });
    }

    if (fields.email.toLowerCase() !== user.email.toLowerCase()) {
      discardUpload();
      return errorResponse("Use your account email for document submissions.", 422, {
        email: ["Must match your signed-in account email."],
      });
    }

    const problem =
      documentFileProblem({ name: fileName, size: upload.bytes }) ??
      (isDocumentAsset(upload) ? null : "This file is not a readable PDF or image.");
    if (problem) {
      discardUpload();
      return errorResponse(problem, 422, { document: [problem] });
    }

    const submission = await db.documentSubmission.create({
      data: {
        fullName: fields.fullName,
        email: fields.email,
        phone: fields.phone || null,
        documentType: fields.documentType,
        fileUrl: upload.secureUrl,
        filePublicId: upload.publicId,
        fileFormat: upload.format ?? null,
        fileName,
        fileResourceType: upload.resourceType,
        message: fields.message || null,
        userId: user.id,
        ipHash,
      },
    });

    await recordFailedAttempt(rateKey);
    after(() =>
      notifyActiveAdmins({
        title: "New document submitted",
        content: `${fields.fullName} submitted a ${fields.documentType}.`,
        type: "DOCUMENT_SUBMITTED",
        category: "ALERT",
        link: "/admin/documents",
      }).catch(console.error),
    );

    return NextResponse.json(
      {
        success: true,
        message: "Your document was submitted. Our team will review it shortly.",
        data: { id: submission.id },
      },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Document submission failed:", error);
    return errorResponse(
      "We could not save your document. Please try again in a moment.",
      500,
    );
  }
}
