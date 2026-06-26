import AdminStudentsPage from "@/components/Admin/pages/AdminStudentsPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export default async function Page() {
  await requireStaff(ADMIN_PERMISSIONS.STUDENTS);
  return <AdminStudentsPage />;
}
