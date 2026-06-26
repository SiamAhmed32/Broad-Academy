import AdminCounsellingPage from "@/components/Admin/pages/AdminCounsellingPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export default async function Page() {
  await requireStaff(ADMIN_PERMISSIONS.COUNSELLING);
  return <AdminCounsellingPage />;
}
