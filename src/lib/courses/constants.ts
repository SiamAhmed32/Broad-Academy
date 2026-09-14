import type { CourseLevel } from "@/generated/prisma/client";
import type { CourseLevelSlug } from "./validation";

export const courseLevelMap: Record<CourseLevelSlug, CourseLevel> = {
  "class-6": "CLASS_6",
  "class-7": "CLASS_7",
  "class-8": "CLASS_8",
  "class-9": "CLASS_9",
  "class-10": "CLASS_10",
  "class-11": "CLASS_11",
  "class-12": "CLASS_12",
};

export const courseLevelLabels: Record<CourseLevel, string> = {
  CLASS_6: "Class 6",
  CLASS_7: "Class 7",
  CLASS_8: "Class 8",
  CLASS_9: "Class 9",
  CLASS_10: "Class 10",
  CLASS_11: "SSC",
  CLASS_12: "Combo",
};

export const courseLevelOptions = Object.entries(courseLevelMap).map(
  ([value, enumValue]) => ({
    value: value as CourseLevelSlug,
    label: courseLevelLabels[enumValue],
  }),
);

export const courseLevelSlugs = Object.fromEntries(
  Object.entries(courseLevelMap).map(([slug, level]) => [level, slug]),
) as Record<CourseLevel, CourseLevelSlug>;
