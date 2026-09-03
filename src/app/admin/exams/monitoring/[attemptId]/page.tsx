import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import AdminStudentExamOverviewPage from "@/components/Admin/pages/AdminStudentExamOverviewPage";

export const metadata = { title: "Student Exam Overview | Admin" };

export default async function AdminStudentExamOverviewRoute({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  await requireStaff(ADMIN_PERMISSIONS.EXAMS);
  const { attemptId } = await params;
  return <AdminStudentExamOverviewPage attemptId={attemptId} />;
}
