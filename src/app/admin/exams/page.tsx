import { requireStaff } from "@/lib/admin/guard";
import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import AdminExamMonitoringPage from "@/components/Admin/pages/AdminExamMonitoringPage";

export const metadata = { title: "Exam Monitoring | Admin" };

export default async function AdminExamMonitoringRoute() {
  await requireStaff(ADMIN_PERMISSIONS.EXAMS);
  return <AdminExamMonitoringPage />;
}
