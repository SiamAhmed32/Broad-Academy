import type { CourseLevel } from "@/generated/prisma/client";

export type PublicCourse = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string;
  category: string;
  level: CourseLevel;
  subject: string;
  instructorName: string;
  thumbnailUrl: string;
  price: number;
  originalPrice: number | null;
  durationMinutes: number;
  lessonCount: number;
  rating: number;
  reviewCount: number;
  studentsCount: number;
  examCount: number;
  featured: boolean;
  badge: string | null;
  publishedAt: string | null;
};

export type CourseFacet = {
  value: string;
  label: string;
  count: number;
};

export type CoursesListData = {
  courses: PublicCourse[];
  categories: CourseFacet[];
  levels: CourseFacet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type CoursesListResponse = {
  success: boolean;
  data: CoursesListData;
};

export type CourseCurriculumLesson = {
  id: string;
  title: string;
  type: "VIDEO" | "READING" | "QUIZ";
  durationSeconds: number;
};

export type CourseCurriculumSection = {
  title: string;
  lessons: CourseCurriculumLesson[];
};

export type EnrollmentGuideVideo = {
  videoId: string;
  watchUrl: string;
  embedUrl: string;
};

/**
 * Public course detail. Deliberately excludes `facebookGroupUrl`: that link is
 * only for enrolled students and must never reach the public page or API.
 */
export type PublicCourseDetail = PublicCourse & {
  /** Long "about the course" text from Admin; line breaks are preserved. */
  description: string | null;
};

/**
 * One teacher shown on the course page. `slug`/`avatarUrl` are set when the
 * name in `Course.instructorName` matches an active instructor profile;
 * otherwise the page falls back to an initials card.
 */
export type CourseInstructor = {
  name: string;
  slug: string | null;
  avatarUrl: string | null;
  subjects: string[];
};

export type CourseDetailData = {
  course: PublicCourseDetail;
  /** Admin-defined "এই কোর্সে যা থাকছে" lines, or generated ones when none are set. */
  includes: string[];
  instructors: CourseInstructor[];
  related: PublicCourse[];
  enrollmentGuideVideo: EnrollmentGuideVideo | null;
};

export type CourseDetailResponse = {
  success: boolean;
  data: CourseDetailData;
};
