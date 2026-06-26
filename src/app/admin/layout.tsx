import type { Metadata } from "next";

import { AdminShell } from "@/components/Admin";
import { getStaffUser } from "@/lib/admin/session";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Admin | Broad Academy",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getStaffUser();
  if (!user) redirect("/login?next=/admin");

  const unreadCount = await db.notification.count({
    where: {
      userId: user.id,
      archived: false,
      read: false,
    },
  });

  return (
    <AdminShell user={user} initialUnreadCount={unreadCount}>
      {children}
    </AdminShell>
  );
}
