import { Suspense } from "react";

import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import AdminExamRequestsPage from "@/components/Admin/pages/AdminExamRequestsPage";

export const metadata = { title: "Exam Access Requests | Admin" };

export default async function AdminExamRequestsRoute() {
  await requireStaff(ADMIN_PERMISSIONS.EXAMS);
  return (
    <Suspense fallback={null}>
      <AdminExamRequestsPage />
    </Suspense>
  );
}
