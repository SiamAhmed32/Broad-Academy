import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { LearningRoom } from "@/components/Learning";
import { requireUser } from "@/lib/auth/session";
import { getLearningRoom } from "@/lib/learning/queries";
import { learningSlugSchema } from "@/lib/learning/validation";

type PageProps = {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
};

export const metadata: Metadata = {
  title: "Learning room",
  robots: { index: false, follow: false },
};

export default async function LessonPage({ params }: PageProps) {
  const user = await requireUser();
  const values = await params;
  const courseSlug = learningSlugSchema.safeParse(values.courseSlug);
  const lessonSlug = learningSlugSchema.safeParse(values.lessonSlug);
  if (!courseSlug.success || !lessonSlug.success) notFound();

  const data = await getLearningRoom(user.id, courseSlug.data, lessonSlug.data);
  if (!data) redirect("/dashboard?notice=not-enrolled");

  return (
    <LearningRoom
      data={data}
      studentName={user.fullName}
      studentEmail={user.email}
    />
  );
}
