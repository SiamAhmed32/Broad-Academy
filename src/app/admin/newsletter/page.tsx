import AdminNewsletterPage from "@/components/Admin/pages/AdminNewsletterPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export const metadata = { title: "Newsletter" };

export default async function Page() {
  await requireStaff(ADMIN_PERMISSIONS.CONTACT);
  return <AdminNewsletterPage />;
}
