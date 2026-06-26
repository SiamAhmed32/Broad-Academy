import type { Metadata } from "next";
import ExamTakeClient from "@/components/Exams/ExamTakeClient";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "Taking Exam | Adib Educare",
  robots: { index: false, follow: false },
};

export default async function ExamTakeRoute({ params }: Props) {
  const { slug } = await params;
  // Fullscreen exam — no Layout wrapper intentionally
  return <ExamTakeClient slug={slug} />;
}
