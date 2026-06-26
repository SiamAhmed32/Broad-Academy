import { NextRequest, NextResponse } from "next/server";

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
import { uploadDocumentSubmission } from "@/lib/documents/cloudinary";
import { documentSubmissionSchema } from "@/lib/documents/validation";
import { notifyActiveAdmins } from "@/lib/notifications/service";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

function cloudinaryErrorMessage(error: unknown) {
  const detail =
    error instanceof Error ? error.message : "Cloudinary upload failed.";
  if (detail.includes("missing permissions")) {
    return "Your Cloudinary API key cannot upload files. In Cloudinary → Settings → API Keys, enable Upload (create) permission, then restart the dev server.";
  }
  return `Document upload failed: ${detail}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!isTrustedOrigin(request)) {
      return errorResponse("Request origin could not be verified.", 403);
    }

    const user = await getCurrentUser();
    if (!user || user.role !== "STUDENT") {
      return errorResponse("Sign in with a student account to submit documents.", 401);
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

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return errorResponse("Invalid form submission.", 400);
    }

    const parsed = documentSubmissionSchema.safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      phone: formData.get("phone"),
      documentType: formData.get("documentType"),
      message: formData.get("message"),
      website: formData.get("website"),
    });

    if (!parsed.success) {
      if (formData.get("website")) {
        return NextResponse.json({ success: true, message: "Thank you." });
      }
      return errorResponse("Please review the highlighted fields.", 422, parsed.error.flatten().fieldErrors);
    }

    if (parsed.data.email.toLowerCase() !== user.email.toLowerCase()) {
      return errorResponse("Use your account email for document submissions.", 422, {
        email: ["Must match your signed-in account email."],
      });
    }

    const file = formData.get("document");
    if (!(file instanceof File) || file.size === 0) {
      return errorResponse("A document file is required.", 422, {
        document: ["Upload a PDF or image file."],
      });
    }
    if (file.size > MAX_FILE_BYTES) {
      return errorResponse("File must be 8 MB or smaller.", 422);
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return errorResponse("Upload a JPG, PNG, WebP, or PDF file.", 422);
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    let upload: Awaited<ReturnType<typeof uploadDocumentSubmission>>;
    try {
      upload = await uploadDocumentSubmission(bytes, file.type, file.name);
    } catch (error) {
      console.error("Cloudinary document upload failed:", error);
      return errorResponse(cloudinaryErrorMessage(error), 502);
    }

    const submission = await db.documentSubmission.create({
      data: {
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone || null,
        documentType: parsed.data.documentType,
        fileUrl: upload.secure_url,
        filePublicId: upload.public_id,
        fileFormat: upload.format,
        fileName: file.name,
        fileResourceType: upload.resource_type,
        message: parsed.data.message || null,
        ipHash,
      },
    });

    await recordFailedAttempt(rateKey);
    void notifyActiveAdmins({
      title: "New document submitted",
      content: `${parsed.data.fullName} submitted a ${parsed.data.documentType}.`,
      type: "DOCUMENT_SUBMITTED",
      category: "ALERT",
      link: "/admin/documents",
    }).catch(() => undefined);

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
