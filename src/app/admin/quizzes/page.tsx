import { Suspense } from "react";

import AdminQuizzesPage from "@/components/Admin/pages/AdminQuizzesPage";
import { AdminLoading } from "@/components/Admin";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export default async function Page() {
  await requireStaff(ADMIN_PERMISSIONS.CONTENT);
  return (
    <Suspense fallback={<AdminLoading label="Loading quizzes..." />}>
      <AdminQuizzesPage />
    </Suspense>
  );
}
