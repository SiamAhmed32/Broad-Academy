export type LearningLesson = {
  id: string;
  slug: string;
  title: string;
  description: string;
  type: "VIDEO" | "READING" | "QUIZ";
  durationSeconds: number;
  content: string | null;
  displayOrder: number;
  completed: boolean;
  watchedSeconds: number;
  lastPositionSec: number;
  resources: Array<{ id: string; title: string; url: string }>;
};

export type CurrentLearningLesson = LearningLesson & {
  youtubeVideoId: string | null;
};

export type LearningModule = {
  id: string;
  title: string;
  description: string | null;
  displayOrder: number;
  lessons: LearningLesson[];
};

export type PublicQuiz = {
  id: string;
  title: string;
  description: string | null;
  passPercent: number;
  timeLimitSeconds: number | null;
  questions: Array<{
    id: string;
    prompt: string;
    options: Array<{ id: string; text: string }>;
  }>;
  latestAttempt: {
    score: number;
    total: number;
    percentage: number;
    passed: boolean;
  } | null;
};

export type LearningRoomData = {
  enrollmentId: string;
  course: {
    id: string;
    slug: string;
    title: string;
    subject: string;
    instructorName: string;
    thumbnailUrl: string;
  };
  modules: LearningModule[];
  currentLesson: CurrentLearningLesson;
  previousLesson: { slug: string; title: string } | null;
  nextLesson: { slug: string; title: string } | null;
  quiz: PublicQuiz | null;
  progress: {
    completed: number;
    total: number;
    percent: number;
  };
};

export type EnrolledCourseSummary = {
  id: string;
  slug: string;
  title: string;
  subject: string;
  thumbnailUrl: string;
  instructorName: string;
  completedLessons: number;
  totalLessons: number;
  progressPercent: number;
  continueLessonSlug: string | null;
};
