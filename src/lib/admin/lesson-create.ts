import { Prisma } from "@/generated/prisma/client";

import { slugify } from "@/lib/admin/utils";
import { db } from "@/lib/db";

async function isLessonSlugTaken(moduleId: string, slug: string) {
  return Boolean(
    await db.lesson.findFirst({
      where: { moduleId, slug },
      select: { id: true },
    }),
  );
}

export async function nextLessonDisplayOrder(moduleId: string) {
  const result = await db.lesson.aggregate({
    where: { moduleId },
    _max: { displayOrder: true },
  });
  return (result._max.displayOrder ?? -1) + 1;
}

export async function resolveUniqueLessonSlug(
  moduleId: string,
  title: string,
  preferred?: string,
) {
  const base = slugify(preferred ?? title) || "lesson";
  let slug = base;
  let attempt = 0;

  while (await isLessonSlugTaken(moduleId, slug)) {
    attempt += 1;
    slug = `${base}-${attempt}`;
  }

  return slug;
}

export function lessonCreateErrorMessage(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return "A lesson with this name or order already exists in this section. Try a different title.";
    }
    if (error.code === "P2003") {
      return "The selected course section could not be found. Refresh the page and try again.";
    }
  }
  return "Could not save the lesson. Please try again.";
}
