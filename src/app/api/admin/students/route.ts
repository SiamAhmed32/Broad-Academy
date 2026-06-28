import { NextRequest, NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { paginate, paginationMeta } from "@/lib/admin/utils";
import {
  adminListQuerySchema,
  adminStudentStatusPatchSchema,
} from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";
import { createUserNotification } from "@/lib/notifications/service";
import {
  sendStudentAccountReactivatedEmail,
  sendStudentAccountSuspendedEmail,
} from "@/lib/students/account-email";

export async function GET(request: NextRequest) {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

  const parsed = adminListQuerySchema.safeParse(
    Object.fromEntries(request.nextUrl.searchParams.entries()),
  );
  if (!parsed.success) return errorResponse("Invalid query.", 422);

  const { search, status, page, limit } = parsed.data;
  const where = {
    role: "STUDENT" as const,
    ...(status ? { status: status as "ACTIVE" | "SUSPENDED" } : {}),
    ...(search
      ? {
          OR: [
            { fullName: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const { skip, take } = paginate(page, limit);
  const [students, total] = await Promise.all([
    db.user.findMany({
      where,
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
        _count: { select: { enrollments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
    db.user.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: { students, pagination: paginationMeta(total, page, limit) },
  });
}

export async function PATCH(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return errorResponse("Request origin could not be verified.", 403);
  }

  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Invalid request body.");
  }

  const parsed = adminStudentStatusPatchSchema.safeParse(body);
  if (!parsed.success) {
    return errorResponse("Invalid data.", 422, parsed.error.flatten().fieldErrors);
  }

  const { id, status, message } = parsed.data;

  const existing = await db.user.findFirst({
    where: { id, role: "STUDENT" },
    select: { id: true, fullName: true, email: true, status: true },
  });

  if (!existing) {
    return errorResponse("Student not found.", 404);
  }

  if (existing.status === status) {
    return errorResponse(
      status === "SUSPENDED"
        ? "This account is already suspended."
        : "This account is already active.",
      409,
    );
  }

  const trimmedMessage = message?.trim() ?? "";

  const student = await db.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: existing.id },
      data: { status },
      select: { id: true, fullName: true, email: true, status: true },
    });

    if (status === "SUSPENDED") {
      await tx.session.deleteMany({ where: { userId: existing.id } });
    }

    return updated;
  });

  if (status === "SUSPENDED") {
    void sendStudentAccountSuspendedEmail({
      studentName: existing.fullName,
      studentEmail: existing.email,
      message: trimmedMessage,
    }).catch((emailError) => {
      console.error("Student suspension email failed:", emailError);
    });

    void createUserNotification({
      userId: existing.id,
      title: "Account suspended",
      content: trimmedMessage,
      type: "ACCOUNT_SUSPENDED",
      category: "ALERT",
      link: "/contact",
    }).catch((notificationError) => {
      console.error("Student suspension notification failed:", notificationError);
    });
  } else {
    void sendStudentAccountReactivatedEmail({
      studentName: existing.fullName,
      studentEmail: existing.email,
    }).catch((emailError) => {
      console.error("Student reactivation email failed:", emailError);
    });

    void createUserNotification({
      userId: existing.id,
      title: "Account approved again",
      content:
        "Your Broad Academy account is active again. You can sign in and continue using courses and student features.",
      type: "ACCOUNT_REACTIVATED",
      category: "UPDATE",
      link: "/dashboard",
    }).catch((notificationError) => {
      console.error("Student reactivation notification failed:", notificationError);
    });
  }

  return NextResponse.json({ success: true, data: student });
}
