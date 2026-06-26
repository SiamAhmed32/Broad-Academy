import AdminCourseEditPage from "@/components/Admin/pages/AdminCourseEditPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

type PageProps = { params: Promise<{ id: string }> };

export default async function Page({ params }: PageProps) {
  await requireStaff(ADMIN_PERMISSIONS.COURSES);
  const { id } = await params;
  return <AdminCourseEditPage courseId={id} />;
}
