import type { Metadata } from "next";
import { redirect } from "next/navigation";

import SubmitDocumentsPage from "@/components/Documents/SubmitDocumentsPage";
import { Layout } from "@/components/Layout";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getStudentSubmissions,
  hasActiveEnrollment,
} from "@/lib/documents/student";

export const metadata: Metadata = {
  title: "Submit Documents | Broad Academy",
  description:
    "Securely upload academic documents, assignments, and supporting files to Broad Academy.",
  robots: { index: false, follow: false },
};

export default async function SubmitDocumentsRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/submit-documents");
  if (user.role !== "STUDENT") redirect("/dashboard");

  const [isEnrolled, submissions] = await Promise.all([
    hasActiveEnrollment(user.id),
    getStudentSubmissions(user),
  ]);

  return (
    <Layout>
      <SubmitDocumentsPage
        profile={{
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        }}
        isEnrolled={isEnrolled}
        submissions={submissions}
      />
    </Layout>
  );
}
