import AdminDashboard from "@/components/Admin/AdminDashboard";
import { getStaffUser } from "@/lib/admin/session";

export default async function AdminHomePage() {
  const user = await getStaffUser();
  if (!user) return null;

  return <AdminDashboard user={user} />;
}
