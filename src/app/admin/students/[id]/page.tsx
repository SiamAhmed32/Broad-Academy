import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import AdminStudentProfilePage from "@/components/Admin/pages/AdminStudentProfilePage";

export const metadata = { title: "Student Profile | Admin" };

export default async function AdminStudentProfileRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff(ADMIN_PERMISSIONS.STUDENTS);
  const { id } = await params;
  return <AdminStudentProfilePage studentId={id} />;
}
