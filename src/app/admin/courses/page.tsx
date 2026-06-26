import AdminCoursesPage from "@/components/Admin/pages/AdminCoursesPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export default async function Page() {
  await requireStaff(ADMIN_PERMISSIONS.COURSES);
  return <AdminCoursesPage />;
}
