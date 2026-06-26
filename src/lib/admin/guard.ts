import { redirect } from "next/navigation";

import type { AdminStaffRole } from "@/generated/prisma/client";
import type { AdminPermission } from "@/lib/admin/permissions";
import {
  getPermissionsForUser,
  hasAdminPermission,
} from "@/lib/admin/permissions";
import { getStaffUser, getStaffUserFromRequest } from "@/lib/admin/session";
import { adminNavItems } from "@/lib/admin/nav";
import { errorResponse } from "@/lib/auth/response";

export async function requireStaff(permission?: AdminPermission) {
  const user = await getStaffUser();
  if (!user) redirect("/login?next=/admin");
  if (permission && !hasAdminPermission(user, permission)) {
    redirect("/admin");
  }
  return user;
}

export async function requireStaffApi(permission?: AdminPermission) {
  const user = await getStaffUserFromRequest();
  if (!user) {
    return { user: null, error: errorResponse("Authentication required.", 401) };
  }
  if (permission && !hasAdminPermission(user, permission)) {
    return {
      user: null,
      error: errorResponse("You do not have permission for this action.", 403),
    };
  }
  return { user, error: null };
}

export function getFirstAllowedAdminPath(user: {
  adminRole: AdminStaffRole | null;
  permissions: string[];
}) {
  const perms = getPermissionsForUser(user);
  const item = adminNavItems.find((nav) => perms.includes(nav.permission));
  return item?.href ?? "/admin";
}
