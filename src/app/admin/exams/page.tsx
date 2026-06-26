import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import AdminExamsPage from "@/components/Admin/pages/AdminExamsPage";

export const metadata = { title: "Standalone Exams | Admin" };

export default async function AdminExamsRoute() {
  await requireStaff(ADMIN_PERMISSIONS.EXAMS);
  return <AdminExamsPage />;
}
