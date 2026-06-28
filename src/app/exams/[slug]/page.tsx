import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Layout } from "@/components/Layout";
import ExamLobbyClient from "@/components/Exams/ExamLobbyClient";
import { getCurrentUser } from "@/lib/auth/session";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Exam | Adib Educare`,
    description: `Join this exam competition on Adib Educare. Test your knowledge and compete on the leaderboard.`,
    alternates: { canonical: `/exams/${slug}` },
  };
}

export default async function ExamLobbyRoute({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();

  if (!user || user.role !== "STUDENT") {
    redirect(`/login?next=/exams/${encodeURIComponent(slug)}`);
  }

  return (
    <Layout>
      <ExamLobbyClient slug={slug} />
    </Layout>
  );
}
