export type CourseLevel =
  | "class-6"
  | "class-7"
  | "class-8"
  | "class-9"
  | "class-10"
  | "class-11"
  | "class-12";

export type CourseTabValue = "all" | CourseLevel;

export type CourseTab = {
  id: number;
  label: string;
  value: CourseTabValue;
};

export type CourseItem = {
  id: number;
  title: string;
  level: CourseLevel;
  subject: string;
  instructor: string;
  price: number;
  time: string;
  chapters: number;
  img: string;
  rating: number;
};

export const tabCategories: CourseTab[] = [
  { id: 1, label: "All", value: "all" },
  { id: 2, label: "Class 6", value: "class-6" },
  { id: 3, label: "Class 7", value: "class-7" },
  { id: 4, label: "Class 8", value: "class-8" },
  { id: 5, label: "Class 9", value: "class-9" },
  { id: 6, label: "Class 10", value: "class-10" },
  { id: 7, label: "Class 11", value: "class-11" },
  { id: 8, label: "Class 12", value: "class-12" },
];

export const coursesData: CourseItem[] = [
  {
    id: 1,
    title: "Class 6 Mathematics Complete Course",
    level: "class-6",
    subject: "Mathematics",
    instructor: "Instructor A",
    price: 800,
    time: "3 months",
    chapters: 42,
    img: "/courses/course-1.jpg",
    rating: 4.8,
  },
  {
    id: 2,
    title: "Class 7 Science Full Course",
    level: "class-7",
    subject: "Science",
    instructor: "Instructor B",
    price: 900,
    time: "3 months",
    chapters: 38,
    img: "/courses/course-2.jpg",
    rating: 4.7,
  },
  {
    id: 3,
    title: "Class 8 English MasteryzSDKFbksbdvkjsbdvjbsdjkbvfjknsdbvjbsdfjb",
    level: "class-8",
    subject: "English",
    instructor: "Instructor C",
    price: 850,
    time: "2.5 months",
    chapters: 34,
    img: "/courses/course-3.jpg",
    rating: 4.8,
  },
  {
    id: 4,
    title: "Class 9 Physics Foundation",
    level: "class-9",
    subject: "Physics",
    instructor: "Instructor D",
    price: 1200,
    time: "4 months",
    chapters: 46,
    img: "/courses/course-4.jpg",
    rating: 4.9,
  },
  {
    id: 5,
    title: "Class 10 Chemistry Exam Prep",
    level: "class-10",
    subject: "Chemistry",
    instructor: "Instructor E",
    price: 1250,
    time: "4 months",
    chapters: 44,
    img: "/courses/course-1.jpg",
    rating: 4.8,
  },
  {
    id: 6,
    title: "Class 11 Higher Mathematics",
    level: "class-11",
    subject: "Higher Mathematics",
    instructor: "Instructor F",
    price: 1500,
    time: "4 months",
    chapters: 50,
    img: "/courses/course-2.jpg",
    rating: 4.9,
  },
  // {
  //   id: 7,
  //   title: "Class 12 Biology Final Revision",
  //   level: "class-12",
  //   subject: "Biology",
  //   instructor: "Instructor G",
  //   price: 1450,
  //   time: "3 months",
  //   chapters: 40,
  //   img: "/courses/course-3.jpg",
  //   rating: 4.7,
  // },
  // {
  //   id: 8,
  //   title: "Class 9-10 Mathematics Board Preparation",
  //   level: "class-10",
  //   subject: "Mathematics",
  //   instructor: "Instructor H",
  //   price: 1350,
  //   time: "4 months",
  //   chapters: 48,
  //   img: "/courses/course-4.jpg",
  //   rating: 4.9,
  // },
];
