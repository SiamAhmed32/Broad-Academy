import AdminInstructorFormPage from "@/components/Admin/pages/AdminInstructorFormPage";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";

type PageProps = { params: Promise<{ slug: string }> };

export default async function Page({ params }: PageProps) {
  await requireStaff(ADMIN_PERMISSIONS.INSTRUCTORS);
  const { slug } = await params;
  return <AdminInstructorFormPage slug={slug} />;
}
