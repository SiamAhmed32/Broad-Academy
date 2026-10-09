import { NextRequest, NextResponse } from "next/server";

import { errorResponse } from "@/lib/auth/response";
import { checkRateLimit, getClientIp, hashValue, isTrustedOrigin } from "@/lib/auth/security";
import { getCurrentUser } from "@/lib/auth/session";
import { documentFileProblem, studentDocumentFolder } from "@/lib/documents/files";
import { hasActiveEnrollment } from "@/lib/documents/student";
import { createDirectUploadTickets } from "@/lib/media/direct-upload";
import { directUploadRequestSchema } from "@/lib/media/direct-upload-schema";

export const runtime = "nodejs";

/** Signs a student's document upload (the file goes straight to Cloudinary). */
export async function POST(request: NextRequest) {
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
  const rateLimit = await checkRateLimit(hashValue(`documents:${user.id}:${ipHash}`));
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
    return errorResponse("Invalid request.", 400);
  }
  const parsed = directUploadRequestSchema.safeParse(body);
  if (!parsed.success) return errorResponse("Choose a file to upload.", 422);

  const problem = documentFileProblem(parsed.data);
  if (problem) return errorResponse(problem, 422, { document: [problem] });

  try {
    const tickets = createDirectUploadTickets(studentDocumentFolder(user.id), [parsed.data.name]);
    return NextResponse.json(
      { success: true, data: { tickets } },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (error) {
    console.error("Could not sign document upload:", error);
    return errorResponse("Uploads are not available right now. Please try again later.", 503);
  }
}
