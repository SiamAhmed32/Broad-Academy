import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { requireStaffApi } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { isValidSscBatch } from "@/lib/students/ssc-batch";

type RouteContext = { params: Promise<{ id: string }> };

const batchSchema = z.object({
  sscBatch: z
    .number()
    .int()
    .nullable()
    .refine((value) => value === null || isValidSscBatch(value), "Enter a valid SSC year."),
});

/** Corrects a student's SSC batch (the year they sit SSC). */
export async function PATCH(request: NextRequest, context: RouteContext) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = batchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse(parsed.error.issues[0]?.message ?? "Invalid SSC batch.", 422);
  }

  const updated = await db.user.updateMany({
    where: { id, role: "STUDENT" },
    data: { sscBatch: parsed.data.sscBatch },
  });
  if (updated.count === 0) return errorResponse("Student not found.", 404);

  return NextResponse.json({
    success: true,
    message: parsed.data.sscBatch ? `SSC batch set to ${parsed.data.sscBatch}.` : "SSC batch cleared.",
    data: { sscBatch: parsed.data.sscBatch },
  });
}
