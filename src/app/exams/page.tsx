import type { Metadata } from "next";
import { Layout } from "@/components/Layout";
import ExamsPageClient from "@/components/Exams/ExamsPageClient";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Exam Arena | Adib Educare",
  description:
    "Compete in live exam competitions. Join free and premium exams, test your knowledge, and climb the leaderboard.",
  openGraph: {
    title: "Exam Arena | Adib Educare",
    description:
      "Live exam competitions for Bangladeshi students. Free and premium exams with real-time leaderboards.",
    type: "website",
  },
};

export default async function ExamsRoute() {
  const user = await getCurrentUser();

  return (
    <Layout>
      <ExamsPageClient isAuthenticated={Boolean(user)} />
    </Layout>
  );
}
