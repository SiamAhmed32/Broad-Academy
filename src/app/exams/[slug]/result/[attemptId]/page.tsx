import type { Metadata } from "next";
import { Layout } from "@/components/Layout";
import ExamResultClient from "@/components/Exams/ExamResultClient";

type Props = { params: Promise<{ slug: string; attemptId: string }> };

export const metadata: Metadata = {
  title: "Exam Result | Adib Educare",
  robots: { index: false, follow: false },
};

export default async function ExamResultRoute({ params }: Props) {
  const { slug, attemptId } = await params;
  return (
    <Layout>
      <ExamResultClient slug={slug} attemptId={attemptId} />
    </Layout>
  );
}
