import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Layout } from "@/components/Layout";
import NoticesPage from "@/components/Notices/NoticesPage";
import { getCurrentUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { serializeNotice } from "@/lib/notices/service";

export const metadata: Metadata = {
  title: "Academy Notices | Broad Academy",
  description: "Official updates and announcements from Broad Academy.",
  robots: { index: false, follow: false },
};

export default async function NoticesRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/notices");

  const notices = await db.notice.findMany({
    where: { published: true },
    orderBy: [{ pinned: "desc" }, { publishedAt: "desc" }],
    take: 100,
  });

  return (
    <Layout>
      <NoticesPage notices={notices.map(serializeNotice)} />
    </Layout>
  );
}
