import type { Exam, ExamQuestion, ExamOption, ExamAttempt } from "@/generated/prisma/client";

export type ExamWithQuestions = Exam & {
  questions: (ExamQuestion & {
    options: ExamOption[];
  })[];
};

export type ExamAttemptWithExam = ExamAttempt & {
  exam: Exam;
};

export type ExamListCardData = Pick<
  Exam,
  | "id"
  | "slug"
  | "title"
  | "code"
  | "bannerUrl"
  | "price"
  | "originalPrice"
  | "durationMinutes"
  | "totalMarks"
  | "startsAt"
  | "endsAt"
  | "status"
>;
