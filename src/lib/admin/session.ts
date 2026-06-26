import { cache } from "react";

import type { AdminUser } from "@/lib/admin/permissions";
import { getCurrentUser } from "@/lib/auth/session";

const staffSelect = {
  id: true,
  fullName: true,
  email: true,
  role: true,
  adminRole: true,
  permissions: true,
  status: true,
} as const;

export const getStaffUser = cache(async (): Promise<AdminUser | null> => {
  const user = await getCurrentUser();
  if (
    !user ||
    user.role !== "ADMIN" ||
    !user.adminRole ||
    user.status !== "ACTIVE"
  ) {
    return null;
  }
  return user as AdminUser;
});

export async function getStaffUserFromRequest(): Promise<AdminUser | null> {
  return getStaffUser();
}

export { staffSelect };
