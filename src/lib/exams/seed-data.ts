import type { ExamStatus } from "@/generated/prisma/client";

type ExamSeed = {
  slug: string;
  title: string;
  /** Rendered as the badge on the top-right of the exam card. */
  code: string;
  description: string;
  price: number;
  originalPrice: number | null;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: number;
  status: ExamStatus;
  startsAt: Date;
  endsAt: Date;
};

const startsAt = new Date("2026-06-01T00:00:00.000Z");
const endsAt = new Date("2027-06-01T00:00:00.000Z");

/**
 * The exam-card artwork reads the trailing number out of the title
 * ("SSC Weekly Test 01" renders as WEEKLY TEST / 01), so keep the numbering
 * suffix when adding new exams here.
 */
export const examSeedData: ExamSeed[] = [
  exam(
    "ssc-weekly-test-01",
    "SSC Weekly Test 01",
    "SSC",
    "Weekly MCQ checkpoint covering the chapters taught in the current SSC batch week.",
    0,
    null,
    25,
    25,
  ),
  exam(
    "class-8-chemistry-chapter-2-test-02",
    "Class 8 Chemistry Chapter 2 Test 02",
    "Class 8",
    "Chapter-wise chemistry practice on atoms, elements, and compounds for Class 8 students.",
    0,
    null,
    20,
    20,
  ),
  exam(
    "ssc-ict-practice-test-01",
    "SSC ICT Practice Test 01",
    "SSC",
    "ICT board-pattern MCQ practice on networking, HTML basics, and database concepts.",
    0,
    null,
    30,
    30,
  ),
  exam(
    "class-7-general-knowledge-test-01",
    "Class 7 General Knowledge Test 01",
    "Class 7",
    "General knowledge quiz on Bangladesh, world affairs, science facts, and everyday reasoning.",
    0,
    null,
    18,
    18,
  ),
  exam(
    "class-8-model-test-03",
    "Class 8 Model Test 03",
    "Class 8",
    "Full-syllabus Class 8 model test with board-style MCQs and instant leaderboard ranking.",
    299,
    399,
    45,
    50,
  ),
  exam(
    "class-7-model-test-02",
    "Class 7 Model Test 02",
    "Class 7",
    "Complete Class 7 model test across mathematics, science, Bangla, and English.",
    249,
    329,
    40,
    45,
  ),
  exam(
    "ssc-full-model-test-01",
    "SSC Full Model Test 01",
    "SSC",
    "Full SSC model test under real exam timing with detailed answer explanations.",
    349,
    449,
    60,
    75,
  ),
  exam(
    "all-exams-model-test-04",
    "All Exams Model Test 04",
    "Exam",
    "Mixed-syllabus competitive model test open to every batch, ranked on a single leaderboard.",
    199,
    259,
    35,
    40,
  ),
];

function exam(
  slug: string,
  title: string,
  code: string,
  description: string,
  price: number,
  originalPrice: number | null,
  durationMinutes: number,
  totalMarks: number,
): ExamSeed {
  return {
    slug,
    title,
    code,
    description,
    price,
    originalPrice,
    durationMinutes,
    totalMarks,
    negativeMarking: price > 0 ? 0.25 : 0,
    status: "PUBLISHED",
    startsAt,
    endsAt,
  };
}
