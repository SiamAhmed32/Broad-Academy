import AdminTestimonialsPage from "@/components/Admin/pages/AdminTestimonialsPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

export const metadata = {
  title: "Testimonials | Broad Academy Admin",
};

export default async function AdminTestimonialsRoutePage() {
  await requireStaff(ADMIN_PERMISSIONS.TESTIMONIALS);
  return <AdminTestimonialsPage />;
}
