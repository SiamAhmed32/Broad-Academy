import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import type { AdminStaffRole } from "@/generated/prisma/client";
import { requireStaffApi } from "@/lib/admin/guard";
import {
  ADMIN_PERMISSIONS,
  assignableRolesFor,
  canManageStaffRoles,
} from "@/lib/admin/permissions";
import { adminStaffUpdateSchema } from "@/lib/admin/validation";
import { errorResponse } from "@/lib/auth/response";
import { isTrustedOrigin } from "@/lib/auth/security";
import { db } from "@/lib/db";

const idSchema = z.string().cuid();
const promoteSchema = z.object({
  userId: idSchema,
  adminRole: adminStaffUpdateSchema.shape.adminRole,
});
const updateSchema = promoteSchema;
const demoteSchema = z.object({ userId: idSchema });

export async function GET(request: NextRequest) {
  const { user: actor, error } = await requireStaffApi(ADMIN_PERMISSIONS.USERS);
  if (error || !actor) return error!;

  const search = request.nextUrl.searchParams.get("search")?.trim().slice(0, 100);
  const [staff, candidates] = await Promise.all([
    db.user.findMany({
      where: { role: "ADMIN" },
      select: {
        id: true,
        fullName: true,
        email: true,
        adminRole: true,
        status: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: [{ adminRole: "asc" }, { createdAt: "asc" }],
    }),
    search && search.length >= 2
      ? db.user.findMany({
          where: {
            role: "STUDENT",
            status: "ACTIVE",
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
          select: { id: true, fullName: true, email: true, phone: true },
          orderBy: { fullName: "asc" },
          take: 8,
        })
      : Promise.resolve([]),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      staff,
      candidates,
      actor: {
        id: actor.id,
        role: actor.adminRole,
        assignableRoles: assignableRolesFor(actor.adminRole),
      },
    },
  });
}

export async function POST(request: NextRequest) {
  const actorResult = await authorizeMutation(request);
  if ("error" in actorResult) return actorResult.error;

  const parsed = promoteSchema.safeParse(actorResult.body);
  if (!parsed.success) return errorResponse("Invalid promotion request.", 422);

  const roleError = validateAssignment(
    actorResult.actor.adminRole,
    null,
    parsed.data.adminRole,
  );
  if (roleError) return errorResponse(roleError, 403);

  const target = await db.user.findFirst({
    where: { id: parsed.data.userId, role: "STUDENT", status: "ACTIVE" },
    select: { id: true },
  });
  if (!target) return errorResponse("Active student account not found.", 404);

  const [promoted] = await db.$transaction([
    db.user.update({
      where: { id: target.id },
      data: {
        role: "ADMIN",
        adminRole: parsed.data.adminRole,
        permissions: [],
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        adminRole: true,
        status: true,
      },
    }),
    db.session.deleteMany({ where: { userId: target.id } }),
  ]);

  return NextResponse.json(
    { success: true, message: "Staff access granted.", data: promoted },
    { status: 201, headers: { "Cache-Control": "no-store" } },
  );
}

export async function PATCH(request: NextRequest) {
  const actorResult = await authorizeMutation(request);
  if ("error" in actorResult) return actorResult.error;

  const parsed = updateSchema.safeParse(actorResult.body);
  if (!parsed.success) return errorResponse("Invalid role update.", 422);
  if (parsed.data.userId === actorResult.actor.id) {
    return errorResponse("You cannot change your own staff role.", 403);
  }

  const target = await db.user.findFirst({
    where: { id: parsed.data.userId, role: "ADMIN" },
    select: { id: true, adminRole: true },
  });
  if (!target?.adminRole) return errorResponse("Staff account not found.", 404);
  if (target.adminRole === "OWNER") {
    return errorResponse("Owner roles are protected and cannot be changed here.", 403);
  }

  const roleError = validateAssignment(
    actorResult.actor.adminRole,
    target.adminRole,
    parsed.data.adminRole,
  );
  if (roleError) return errorResponse(roleError, 403);

  const [updated] = await db.$transaction([
    db.user.update({
      where: { id: target.id },
      data: { adminRole: parsed.data.adminRole, permissions: [] },
      select: {
        id: true,
        fullName: true,
        email: true,
        adminRole: true,
        status: true,
      },
    }),
    db.session.deleteMany({ where: { userId: target.id } }),
  ]);

  return NextResponse.json({
    success: true,
    message: "Staff role updated. Existing sessions were revoked.",
    data: updated,
  });
}

export async function DELETE(request: NextRequest) {
  const actorResult = await authorizeMutation(request);
  if ("error" in actorResult) return actorResult.error;

  const parsed = demoteSchema.safeParse(actorResult.body);
  if (!parsed.success) return errorResponse("Invalid access removal request.", 422);
  if (parsed.data.userId === actorResult.actor.id) {
    return errorResponse("You cannot remove your own staff access.", 403);
  }

  const target = await db.user.findFirst({
    where: { id: parsed.data.userId, role: "ADMIN" },
    select: { id: true, adminRole: true },
  });
  if (!target?.adminRole) return errorResponse("Staff account not found.", 404);
  if (target.adminRole === "OWNER") {
    return errorResponse("Owner access cannot be removed here.", 403);
  }
  if (
    actorResult.actor.adminRole === "ADMIN" &&
    target.adminRole === "ADMIN"
  ) {
    return errorResponse("Admins cannot remove another Admin.", 403);
  }

  await db.$transaction([
    db.user.update({
      where: { id: target.id },
      data: { role: "STUDENT", adminRole: null, permissions: [] },
    }),
    db.session.deleteMany({ where: { userId: target.id } }),
  ]);

  return NextResponse.json({
    success: true,
    message: "Staff access removed. The account is now a student account.",
  });
}

async function authorizeMutation(request: NextRequest) {
  if (!isTrustedOrigin(request)) {
    return { error: errorResponse("Request origin could not be verified.", 403) };
  }
  if (Number(request.headers.get("content-length") || 0) > 5_000) {
    return { error: errorResponse("Request is too large.", 413) };
  }

  const { user, error } = await requireStaffApi(ADMIN_PERMISSIONS.USERS);
  if (error || !user) return { error: error! };
  if (!canManageStaffRoles(user.adminRole)) {
    return { error: errorResponse("Only Owners and Admins can manage staff.", 403) };
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return { error: errorResponse("Invalid request body.") };
  }
  return { actor: user, body };
}

function validateAssignment(
  actorRole: AdminStaffRole,
  targetRole: AdminStaffRole | null,
  requestedRole: AdminStaffRole,
) {
  if (!assignableRolesFor(actorRole).includes(requestedRole)) {
    return "You cannot assign that staff role.";
  }
  if (
    actorRole === "ADMIN" &&
    (targetRole === "OWNER" || targetRole === "ADMIN")
  ) {
    return "Admins cannot modify Owner or Admin accounts.";
  }
  return null;
}
