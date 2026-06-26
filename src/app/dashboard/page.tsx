import { notFound, redirect } from "next/navigation";

import { StudentPortal } from "@/components/Dashboard";
import { getAuthenticatedSession } from "@/lib/auth/session";
import { getStudentPortalData } from "@/lib/student/queries";

export const metadata = {
  title: "Student Portal",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const auth = await getAuthenticatedSession();
  if (!auth) redirect("/login");
  if (auth.user.role === "ADMIN") redirect("/admin");

  const data = await getStudentPortalData(auth.user.id, auth.sessionId);
  if (!data) notFound();

  const rawTab = (await searchParams).tab;
  return (
    <StudentPortal
      data={data}
      initialTab={Array.isArray(rawTab) ? rawTab[0] : rawTab}
    />
  );
}
