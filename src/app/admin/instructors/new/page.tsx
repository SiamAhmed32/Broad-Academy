import AdminInstructorFormPage from "@/components/Admin/pages/AdminInstructorFormPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export default async function Page() {
  await requireStaff(ADMIN_PERMISSIONS.INSTRUCTORS);
  return <AdminInstructorFormPage />;
}
