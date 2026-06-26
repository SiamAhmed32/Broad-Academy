import AdminDocumentsPage from "@/components/Admin/pages/AdminDocumentsPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export default async function Page() {
  await requireStaff(ADMIN_PERMISSIONS.DOCUMENTS);
  return <AdminDocumentsPage />;
}
