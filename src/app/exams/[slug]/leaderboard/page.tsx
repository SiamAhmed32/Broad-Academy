import type { Metadata } from "next";
import { Layout } from "@/components/Layout";
import ExamLeaderboardClient from "@/components/Exams/ExamLeaderboardClient";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `Leaderboard | Adib Educare`,
    description: `Top scores and rankings for this exam on Adib Educare.`,
    alternates: { canonical: `/exams/${slug}/leaderboard` },
  };
}

export default async function ExamLeaderboardRoute({ params }: Props) {
  const { slug } = await params;
  return (
    <Layout>
      <ExamLeaderboardClient slug={slug} />
    </Layout>
  );
}
