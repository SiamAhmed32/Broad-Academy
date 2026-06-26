import { Suspense } from "react";

import AdminEnrollmentsPage from "@/components/Admin/pages/AdminEnrollmentsPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export default async function Page() {
  await requireStaff(ADMIN_PERMISSIONS.ENROLLMENTS);
  return (
    <Suspense fallback={null}>
      <AdminEnrollmentsPage />
    </Suspense>
  );
}
