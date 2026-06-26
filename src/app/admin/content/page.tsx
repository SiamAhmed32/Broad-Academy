import AdminContentPage from "@/components/Admin/pages/AdminContentPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export default async function Page() {
  await requireStaff(ADMIN_PERMISSIONS.CONTENT);
  return <AdminContentPage />;
}
