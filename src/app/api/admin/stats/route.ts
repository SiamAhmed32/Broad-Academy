import { NextResponse } from "next/server";

import { ADMIN_PERMISSIONS } from "@/lib/admin/permissions";
import { requireStaffApi } from "@/lib/admin/guard";
import { getAdminDashboardStats } from "@/lib/admin/dashboard-stats";

export async function GET() {
  const { error } = await requireStaffApi(ADMIN_PERMISSIONS.STUDENTS);
  if (error) return error;

  const stats = await getAdminDashboardStats();
  return NextResponse.json(
    { success: true, data: stats },
    { headers: { "Cache-Control": "no-store" } },
  );
}
