export type TestimonialItem = {
  id: number | string;
  name: string;
  identity: string;
  review: string;
  image: string;
  rating?: number;
};

export const testimonialData: TestimonialItem[] = [
  {
    id: 1,
    name: "Nusrat Jahan",
    identity: "Parent of Class 7 Student",
    review:
      "Broad Academy helped my son become more regular with his studies. The lessons are clear, and he now feels more confident before exams. ",
    image: "/testimonials/img1.jpg",
  },
  {
    id: 2,
    name: "Arif Hasan",
    identity: "Class 10 Student",
    review:
      "The teachers explain difficult topics step by step. I finally understand the chapters that used to feel confusing in school.",
    image: "/testimonials/img2.jpg",
  },
  {
    id: 3,
    name: "Farzana Akter",
    identity: "Guardian of Class 8 Student",
    review:
      "The guidance feels personal and organized. I can see real improvement in my daughter's study routine and confidence.",
    image: "/testimonials/img3.jpg",
  },
  {
    id: 4,
    name: "Sadia Islam",
    identity: "HSC Candidate",
    review:
      "The classes helped me revise faster and focus on the important topics. It made my preparation much more structured.",
    image: "/testimonials/img4.jpg",
  },
  {
    id: 5,
    name: "Mahmud Rahman",
    identity: "Parent of Class 9 Student",
    review:
      "I like how the courses keep students focused without overwhelming them. The explanations are simple, practical, and exam-friendly.",
    image: "/testimonials/img5.jpg",
  },
  {
    id: 6,
    name: "Tanzim Ahmed",
    identity: "Class 12 Student",
    review:
      "The revision support is very helpful. I can track what I need to study and feel less stressed before tests.",
    image: "/testimonials/img6.jpg",
  },
  {
    id: 7,
    name: "Maliha Khan",
    identity: "Class 6 Student",
    review:
      "The lessons are easy to follow, and I enjoy learning more now. The teachers make every topic feel simple.",
    image: "/testimonials/img7.jpg",
  },
  {
    id: 8,
    name: "Rafiq Islam",
    identity: "Guardian, Dhaka",
    review:
      "Broad Academy gives the kind of academic support parents look for: clear teaching, regular guidance, and better confidence.",
    image: "/testimonials/img8.jpg",
  },
];
