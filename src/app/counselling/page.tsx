import type { Metadata } from "next";

import { Layout } from "@/components/Layout";
import CounsellingPageContent from "@/components/ConsultationSection/CounsellingPageContent";

export const metadata: Metadata = {
  title: "Parent Academic Counselling",
  description:
    "Parents can request a one-on-one academic guidance session to choose the right course, study plan, and support path for their child.",
};

export default function CounsellingPage() {
  return (
    <Layout>
      <CounsellingPageContent />
    </Layout>
  );
}
