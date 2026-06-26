import type { CourseLevel, CourseStatus } from "@/generated/prisma/client";

type CourseSeed = {
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
  status: CourseStatus;
  publishedAt: Date;
};

const publishedAt = new Date("2026-06-01T00:00:00.000Z");

export const courseSeedData: CourseSeed[] = [
  course("class-6-mathematics-foundation", "Class 6 Mathematics Foundation", "Build confidence in arithmetic, fractions, geometry, and problem solving with guided chapter practice.", "Mathematics", "CLASS_6", "Mathematics", "Mahmudul Hasan", 850, 1100, 1800, 36, 4.9, 328, 4200, true, "Popular", 1),
  course("class-6-general-science", "Class 6 General Science Explorer", "Understand core science concepts through simple explanations, visual examples, and regular quizzes.", "Science", "CLASS_6", "General Science", "Nusrat Jahan", 780, 950, 1500, 31, 4.7, 185, 2700, false, null, 2),
  course("class-6-english-grammar", "Class 6 English Grammar & Writing", "Strengthen grammar, vocabulary, paragraph writing, and everyday English communication skills.", "English", "CLASS_6", "English", "Farzana Rahman", 720, null, 1320, 28, 4.8, 142, 1900, false, "New", 3),
  course("class-7-mathematics-mastery", "Class 7 Mathematics Mastery", "Master algebraic expressions, ratio, geometry, and practical mathematics step by step.", "Mathematics", "CLASS_7", "Mathematics", "Mahmudul Hasan", 900, 1150, 1920, 40, 4.8, 274, 3500, true, "Bestseller", 4),
  course("class-7-science-complete", "Class 7 Science Complete Course", "Learn biology, chemistry, physics, and environmental science with concept-focused lessons.", "Science", "CLASS_7", "General Science", "Nusrat Jahan", 880, null, 1740, 35, 4.7, 210, 2900, false, null, 1),
  course("class-7-bangla-writing", "Class 7 Bangla Language & Writing", "Improve grammar, creative writing, comprehension, and exam-ready answer presentation.", "Bangla", "CLASS_7", "Bangla", "Samira Sultana", 690, 850, 1260, 26, 4.6, 98, 1400, false, null, 2),
  course("class-8-mathematics-advanced", "Class 8 Advanced Mathematics", "Prepare for secondary-level mathematics with strong algebra, geometry, and data concepts.", "Mathematics", "CLASS_8", "Mathematics", "Mahmudul Hasan", 980, 1250, 2100, 43, 4.9, 341, 3900, true, "Top rated", 3),
  course("class-8-science-concepts", "Class 8 Science Concept Builder", "Develop deeper scientific understanding with experiments, diagrams, and exam-style questions.", "Science", "CLASS_8", "General Science", "Nusrat Jahan", 950, null, 1980, 39, 4.8, 238, 3100, false, null, 4),
  course("class-8-english-mastery", "Class 8 English Mastery", "Practice grammar, reading comprehension, email writing, and composition with clear feedback.", "English", "CLASS_8", "English", "Farzana Rahman", 820, 990, 1560, 33, 4.7, 176, 2300, false, "Exam ready", 1),
  course("class-9-physics-foundation", "Class 9 Physics Foundation", "Understand motion, force, energy, waves, and measurement through visual problem solving.", "Physics", "CLASS_9", "Physics", "Dr. Arif Ahmed", 1250, 1500, 2280, 46, 4.9, 412, 5100, true, "Popular", 2),
  course("class-9-chemistry-foundation", "Class 9 Chemistry Foundation", "Learn atomic structure, chemical reactions, mole concepts, and laboratory fundamentals.", "Chemistry", "CLASS_9", "Chemistry", "Tahmina Akter", 1200, 1450, 2160, 44, 4.8, 306, 4300, true, null, 3),
  course("class-9-biology-complete", "Class 9 Biology Complete Course", "Explore cells, tissues, diversity, nutrition, and human physiology with detailed diagrams.", "Biology", "CLASS_9", "Biology", "Dr. Sabiha Noor", 1180, null, 2040, 42, 4.8, 267, 3700, false, "New", 4),
  course("class-9-general-mathematics", "Class 9 General Mathematics", "Build SSC mathematics confidence through theorem practice, algebra, and structured problem sets.", "Mathematics", "CLASS_9", "General Mathematics", "Mahmudul Hasan", 1300, 1550, 2400, 49, 4.9, 458, 5600, true, "Bestseller", 1),
  course("class-10-physics-board-prep", "Class 10 Physics Board Preparation", "Revise the complete SSC physics syllabus with CQ, MCQ, numerical, and model tests.", "Physics", "CLASS_10", "Physics", "Dr. Arif Ahmed", 1450, 1750, 2520, 51, 4.9, 536, 6800, true, "Board prep", 2),
  course("class-10-chemistry-board-prep", "Class 10 Chemistry Board Preparation", "Practice high-priority SSC chemistry chapters, equations, calculations, and board questions.", "Chemistry", "CLASS_10", "Chemistry", "Tahmina Akter", 1420, 1700, 2460, 50, 4.8, 421, 5900, true, "Board prep", 3),
  course("class-10-biology-board-prep", "Class 10 Biology Board Preparation", "Complete SSC biology revision with diagrams, creative questions, and chapter-wise tests.", "Biology", "CLASS_10", "Biology", "Dr. Sabiha Noor", 1380, 1650, 2340, 47, 4.8, 389, 5200, false, "Board prep", 4),
  course("class-10-english-first-paper", "SSC English First Paper Success", "Improve reading, writing, vocabulary, and board-question strategy for SSC English.", "English", "CLASS_10", "English", "Farzana Rahman", 1100, 1350, 1800, 37, 4.7, 294, 4100, false, null, 1),
  course("class-11-higher-mathematics", "Class 11 Higher Mathematics", "Start HSC mathematics strongly with matrices, vectors, functions, limits, and calculus.", "Mathematics", "CLASS_11", "Higher Mathematics", "Professor Rezaul Karim", 1650, 1950, 2700, 55, 4.9, 318, 3600, true, "Advanced", 2),
  course("class-11-physics-first-paper", "HSC Physics First Paper", "Learn vectors, dynamics, gravitation, properties of matter, and periodic motion conceptually.", "Physics", "CLASS_11", "Physics", "Dr. Arif Ahmed", 1700, 2050, 2820, 57, 4.8, 276, 3300, true, null, 3),
  course("class-11-chemistry-first-paper", "HSC Chemistry First Paper", "Build a solid HSC chemistry base in qualitative analysis, periodicity, bonding, and reactions.", "Chemistry", "CLASS_11", "Chemistry", "Tahmina Akter", 1680, null, 2640, 53, 4.8, 241, 2900, false, "New", 4),
  course("class-12-higher-math-final", "HSC Higher Mathematics Final Revision", "Revise calculus, complex numbers, conics, probability, and board-focused problem solving.", "Mathematics", "CLASS_12", "Higher Mathematics", "Professor Rezaul Karim", 1850, 2200, 2520, 52, 4.9, 362, 4400, true, "Final revision", 1),
  course("class-12-physics-final", "HSC Physics Final Revision", "Complete fast, strategic revision of both physics papers with numericals and model tests.", "Physics", "CLASS_12", "Physics", "Dr. Arif Ahmed", 1900, 2250, 2580, 54, 4.9, 408, 4700, true, "Final revision", 2),
  course("class-12-chemistry-final", "HSC Chemistry Final Revision", "Strengthen organic, industrial, environmental, and quantitative chemistry before the exam.", "Chemistry", "CLASS_12", "Chemistry", "Tahmina Akter", 1880, 2200, 2460, 50, 4.8, 337, 4100, false, "Final revision", 3),
  course("class-12-biology-final", "HSC Biology Final Revision", "Revise genetics, biotechnology, ecology, physiology, and essential diagrams efficiently.", "Biology", "CLASS_12", "Biology", "Dr. Sabiha Noor", 1800, null, 2400, 49, 4.8, 301, 3800, false, "Final revision", 4),
];

function course(
  slug: string,
  title: string,
  shortDescription: string,
  category: string,
  level: CourseLevel,
  subject: string,
  instructorName: string,
  price: number,
  originalPrice: number | null,
  durationMinutes: number,
  lessonCount: number,
  rating: number,
  reviewCount: number,
  studentsCount: number,
  featured: boolean,
  badge: string | null,
  image: number,
): CourseSeed {
  return {
    slug,
    title,
    shortDescription,
    category,
    level,
    subject,
    instructorName,
    thumbnailUrl: `/courses/course-${image}.jpg`,
    price,
    originalPrice,
    durationMinutes,
    lessonCount,
    rating,
    reviewCount,
    studentsCount,
    featured,
    badge,
    status: "PUBLISHED",
    publishedAt,
  };
}
