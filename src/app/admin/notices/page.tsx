import AdminNoticesPage from "@/components/Admin/pages/AdminNoticesPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export const metadata = {
  title: "Academy Notices | Broad Academy Admin",
};

export default async function AdminNoticesRoutePage() {
  await requireStaff(ADMIN_PERMISSIONS.STUDENTS);
  return <AdminNoticesPage />;
}
