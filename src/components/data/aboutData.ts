import {
  BookOpen,
  Compass,
  GraduationCap,
  HeartHandshake,
  Lightbulb,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react";

export const aboutStats = [
  { id: 1, label: "Students Guided", value: 130000, suffix: "+", icon: UsersRound },
  { id: 2, label: "Expert Mentors", value: 27, suffix: "+", icon: GraduationCap },
  { id: 3, label: "Courses Offered", value: 120, suffix: "+", icon: BookOpen },
  { id: 4, label: "Parent Sessions", value: 2000, suffix: "+", icon: HeartHandshake },
];

export const aboutMission = {
  mission: {
    title: "Our Mission",
    description:
      "To make high-quality education accessible, structured, and inspiring for every learner — from curious Class 6 students to ambitious HSC candidates — while empowering parents to actively support their child's growth.",
    icon: Target,
  },
  vision: {
    title: "Our Vision",
    description:
      "A Bangladesh where every student learns with confidence, clarity, and purpose — equipped not just for exams, but for a lifetime of curiosity, leadership, and meaningful achievement.",
    icon: Compass,
  },
  values: {
    title: "Our Values",
    description:
      "Excellence without pressure. Mentorship with empathy. Progress measured in confidence as much as grades. We believe learning should feel human, not overwhelming.",
    icon: Sparkles,
  },
};

export const aboutStory = {
  eyebrow: "Our Story",
  title: "Built for Students. Trusted by Families.",
  paragraphs: [
    "Broad Academy began with a simple belief: every student deserves guidance that feels personal, not generic. What started as a small circle of dedicated teachers has grown into a vibrant learning community serving learners across Bangladesh.",
    "Today, we combine expert instruction, structured curricula, and caring mentorship to help students master their subjects — while giving parents the clarity and support they need at every stage of the journey.",
    "From foundational classes to board exam preparation, our approach stays the same: meet learners where they are, build confidence step by step, and celebrate progress along the way.",
  ],
  image: {
    src: "https://images.pexels.com/photos/8199564/pexels-photo-8199564.jpeg?auto=compress&cs=tinysrgb&w=1200",
    alt: "Students learning together in a bright classroom",
  },
  highlights: [
    { label: "Founded", value: "2018" },
    { label: "Classes Covered", value: "Class 6 – HSC" },
    { label: "Learning Mode", value: "Live + Recorded" },
  ],
};

export const aboutPillars = [
  {
    id: 1,
    title: "Expert-Led Instruction",
    description:
      "Learn from experienced mentors who simplify complex topics and teach with real exam insight.",
    icon: GraduationCap,
  },
  {
    id: 2,
    title: "Structured Learning Paths",
    description:
      "Clear syllabi, revision cycles, and progress tracking so students always know what to focus on next.",
    icon: BookOpen,
  },
  {
    id: 3,
    title: "Parent Partnership",
    description:
      "Counselling sessions and progress updates that keep families informed and involved.",
    icon: HeartHandshake,
  },
  {
    id: 4,
    title: "Confidence-First Approach",
    description:
      "We build understanding before memorization — helping students feel capable, not anxious.",
    icon: Lightbulb,
  },
  {
    id: 5,
    title: "Safe & Supportive Space",
    description:
      "A respectful environment where questions are welcome and every learner is encouraged to grow.",
    icon: ShieldCheck,
  },
  {
    id: 6,
    title: "Future-Ready Skills",
    description:
      "Beyond textbooks — critical thinking, communication, and study habits that last a lifetime.",
    icon: Rocket,
  },
];

export const aboutTimeline = [
  {
    year: "2018",
    title: "The Beginning",
    description:
      "Broad Academy launched with a mission to deliver quality tutoring for secondary students in Dhaka.",
  },
  {
    year: "2020",
    title: "Going Digital",
    description:
      "Expanded to live online classes, reaching students across Bangladesh during a pivotal shift in education.",
  },
  {
    year: "2022",
    title: "Parent Counselling",
    description:
      "Introduced dedicated parent guidance sessions — helping families navigate academic decisions together.",
  },
  {
    year: "2024",
    title: "Full Curriculum Coverage",
    description:
      "Extended programs from Class 6 through HSC with specialized board exam preparation tracks.",
  },
  {
    year: "Today",
    title: "A Growing Community",
    description:
      "130,000+ students, 27+ mentors, and a learning ecosystem built on trust, results, and care.",
  },
];

export const aboutApproach = {
  eyebrow: "How We Teach",
  title: "Learning That Actually Sticks",
  steps: [
    {
      step: "01",
      title: "Assess & Understand",
      description:
        "We identify each student's level, gaps, and goals before building a personalized path forward.",
    },
    {
      step: "02",
      title: "Teach with Clarity",
      description:
        "Concept-first lessons with visuals, examples, and practice — making hard topics feel approachable.",
    },
    {
      step: "03",
      title: "Practice & Revise",
      description:
        "Regular quizzes, past-paper drills, and spaced revision to strengthen retention and exam readiness.",
    },
    {
      step: "04",
      title: "Review & Grow",
      description:
        "Progress check-ins with students and parents to celebrate wins and adjust the plan when needed.",
    },
  ],
};
