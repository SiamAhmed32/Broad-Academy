import type { Metadata } from "next";
import { Layout } from "@/components/Layout";
import ExamLobbyClient from "@/components/Exams/ExamLobbyClient";

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
  return (
    <Layout>
      <ExamLobbyClient slug={slug} />
    </Layout>
  );
}
