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

export type CourseDetailData = {
  course: PublicCourse;
  outcomes: string[];
  requirements: string[];
  includes: string[];
  curriculum: CourseCurriculumSection[];
  related: PublicCourse[];
  enrollmentGuideVideo: EnrollmentGuideVideo | null;
};

export type CourseDetailResponse = {
  success: boolean;
  data: CourseDetailData;
};
