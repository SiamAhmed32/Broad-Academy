import type { Metadata } from "next";
import AdminAnnouncementsPage from "@/components/Admin/pages/AdminAnnouncementsPage";

export const metadata: Metadata = {
  title: "Manage Announcements",
  description: "Configure the top announcement bar banners.",
};

export default function Page() {
  return <AdminAnnouncementsPage />;
}
