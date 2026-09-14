import type { Metadata } from "next";

import { Layout } from "@/components/Layout";
import CounsellingPageContent from "@/components/ConsultationSection/CounsellingPageContent";

export const metadata: Metadata = {
  title: "Parent Academic Counselling",
  description:
    "Request a parent counselling session. Our advisors will reach out personally to help you choose the right academic path for your child.",
};

export default function CounsellingPage() {
  return (
    <Layout>
      <CounsellingPageContent />
    </Layout>
  );
}
