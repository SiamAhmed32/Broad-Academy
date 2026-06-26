import AdminContactPage from "@/components/Admin/pages/AdminContactPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export default async function Page() {
  await requireStaff(ADMIN_PERMISSIONS.CONTACT);
  return <AdminContactPage />;
}
