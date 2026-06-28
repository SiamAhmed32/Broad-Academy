import type { Metadata } from "next";
import { redirect } from "next/navigation";

import ExamTakeClient from "@/components/Exams/ExamTakeClient";
import { getCurrentUser } from "@/lib/auth/session";

type Props = { params: Promise<{ slug: string }> };

export const metadata: Metadata = {
  title: "Taking Exam | Adib Educare",
  robots: { index: false, follow: false },
};

export default async function ExamTakeRoute({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "STUDENT") {
    redirect(`/login?next=/exams/${encodeURIComponent(slug)}/take`);
  }

  // Fullscreen exam — no Layout wrapper intentionally
  return <ExamTakeClient slug={slug} />;
}
