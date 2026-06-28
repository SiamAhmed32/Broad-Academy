import { Suspense } from "react";

import AdminPeoplePage from "@/components/Admin/pages/AdminPeoplePage";
import { requireStaff } from "@/lib/admin/guard";
import {
  ADMIN_PERMISSIONS,
  hasAdminPermission,
} from "@/lib/admin/permissions";

export default async function Page() {
  const user = await requireStaff();
  const canViewUsers = hasAdminPermission(user, ADMIN_PERMISSIONS.STUDENTS);
  const canViewEnrollments = hasAdminPermission(user, ADMIN_PERMISSIONS.ENROLLMENTS);

  if (!canViewUsers && !canViewEnrollments) {
    await requireStaff(ADMIN_PERMISSIONS.STUDENTS);
  }

  return (
    <Suspense fallback={null}>
      <AdminPeoplePage
        defaultTab={canViewUsers ? "users" : "requests"}
        canViewUsers={canViewUsers}
        canViewEnrollments={canViewEnrollments}
      />
    </Suspense>
  );
}
