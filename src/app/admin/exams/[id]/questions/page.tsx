import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { db } from "@/lib/db";
import AdminExamQuestionsPage from "@/components/Admin/pages/AdminExamQuestionsPage";

export const metadata = { title: "Question Bank | Admin" };

export default async function AdminExamQuestionsRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await requireStaff(ADMIN_PERMISSIONS.EXAMS);

  const exam = await db.exam.findUnique({
    where: { id },
    select: { id: true, title: true },
  });
  if (!exam) redirect("/admin/exams");

  return <AdminExamQuestionsPage examId={exam.id} examTitle={exam.title} />;
}
