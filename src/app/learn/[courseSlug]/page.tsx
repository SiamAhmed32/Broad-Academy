import { notFound, redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { getFirstEnrolledLesson } from "@/lib/learning/queries";
import { learningSlugSchema } from "@/lib/learning/validation";

type PageProps = {
  params: Promise<{ courseSlug: string }>;
};

export default async function CourseLearningEntry({ params }: PageProps) {
  const user = await requireUser();
  const parsed = learningSlugSchema.safeParse((await params).courseSlug);
  if (!parsed.success) notFound();

  const result = await getFirstEnrolledLesson(user.id, parsed.data);
  if (!result.access) redirect("/dashboard?notice=not-enrolled");
  if (!result.lessonSlug) redirect("/dashboard?notice=course-empty");

  redirect(`/learn/${parsed.data}/${result.lessonSlug}`);
}
