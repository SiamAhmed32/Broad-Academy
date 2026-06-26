import type { Metadata } from "next";
import { redirect } from "next/navigation";

import SubmitDocumentsPage from "@/components/Documents/SubmitDocumentsPage";
import { Layout } from "@/components/Layout";
import { getCurrentUser } from "@/lib/auth/session";

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

  return (
    <Layout>
      <SubmitDocumentsPage
        profile={{
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
        }}
      />
    </Layout>
  );
}
