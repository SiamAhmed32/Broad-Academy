import AdminTeamPage from "@/components/Admin/pages/AdminTeamPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export default async function Page() {
  await requireStaff(ADMIN_PERMISSIONS.USERS);
  return <AdminTeamPage />;
}
