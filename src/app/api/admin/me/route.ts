import { NextResponse } from "next/server";

import {
  getPermissionsForUser,
  resolveAdminRole,
  ADMIN_ROLE_LABELS,
} from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";

export async function GET() {
  const { user, error } = await requireStaffApi();
  if (error || !user) return error!;

  return NextResponse.json({
    success: true,
    data: {
      user,
      roleLabel: ADMIN_ROLE_LABELS[resolveAdminRole(user.adminRole)],
      permissions: getPermissionsForUser(user),
    },
  });
}
