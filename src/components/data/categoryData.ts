export type CategoryItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  subjectCount: number;
};

export const categoryData: CategoryItem[] = [
  {
    id: "class-6",
    title: "Class 6",
    subtitle: "Strong fundamentals",
    description:
      "Core lessons, notes, and guided practice for daily confidence.",
    subjectCount: 4,
  },
  {
    id: "class-7",
    title: "Class 7",
    subtitle: "Step-by-step progress",
    description:
      "Structured topics and regular revision for steady growth.",
    subjectCount: 5,
  },
  {
    id: "class-8",
    title: "Class 8",
    subtitle: "Concept clarity",
    description:
      "Chapter-wise learning with stronger concept-building support.",
    subjectCount: 5,
  },
  {
    id: "class-9",
    title: "Class 9",
    subtitle: "Board-ready preparation",
    description:
      "Smarter routines and focused prep for school and board exams.",
    subjectCount: 6,
  },
  {
    id: "class-10",
    title: "Class 10",
    subtitle: "Exam confidence",
    description:
      "Important chapters, practice sets, and scoring strategies.",
    subjectCount: 6,
  },
  {
    id: "class-11",
    title: "Class 11",
    subtitle: "Stream-focused learning",
    description:
      "Advanced topics with deeper explanation and guided support.",
    subjectCount: 7,
  },
  {
    id: "class-12",
    title: "Class 12",
    subtitle: "Final-year mastery",
    description:
      "Final-year preparation with strategy, review, and exam practice.",
    subjectCount: 7,
  },
];
