import AdminInstructorsPage from "@/components/Admin/pages/AdminInstructorsPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export default async function Page() {
  await requireStaff(ADMIN_PERMISSIONS.INSTRUCTORS);
  return <AdminInstructorsPage />;
}
