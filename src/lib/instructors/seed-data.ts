import type { CreateInstructorInput } from "@/lib/instructors/validation";
import { slugify } from "@/lib/instructors/utils";

type SeedInstructor = Omit<CreateInstructorInput, "slug"> & { slug?: string };

const instructors: SeedInstructor[] = [
  {
    fullName: "Dr. Farhana Rahman",
    title: "Senior Mathematics Strategist",
    shortBio:
      "Transforms complex calculus and algebra into intuitive learning journeys for SSC & HSC students.",
    bio: "Dr. Farhana Rahman brings over 14 years of classroom excellence and curriculum design experience. She specializes in building mathematical confidence through visual reasoning, real-world problem sets, and exam-focused mastery plans. Her students consistently rank in the top percentiles of national board examinations.",
    avatarUrl:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=800",
    coverUrl:
      "https://images.pexels.com/photos/590570/pexels-photo-590570.jpeg?auto=compress&cs=tinysrgb&w=1600",
    specialty: "Mathematics",
    subjects: ["Algebra", "Calculus", "Geometry", "Statistics"],
    expertise: ["Board Exam Prep", "Problem Solving", "Concept Mapping"],
    experienceYears: 14,
    studentsCount: 4200,
    coursesCount: 18,
    rating: 4.9,
    reviewCount: 312,
    featured: true,
    displayOrder: 1,
    status: "ACTIVE",
  },
  {
    fullName: "Mohammad Arif Hossain",
    title: "Physics & Engineering Mentor",
    shortBio:
      "Makes mechanics, optics, and modern physics feel approachable with lab-style demonstrations.",
    bio: "Arif combines engineering rigor with storytelling to help students grasp abstract physics concepts. From Newtonian mechanics to electromagnetism, his sessions blend theory, simulations, and past-paper drills designed for competitive exam success.",
    avatarUrl:
      "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800",
    coverUrl:
      "https://images.pexels.com/photos/256262/pexels-photo-256262.jpeg?auto=compress&cs=tinysrgb&w=1600",
    specialty: "Physics",
    subjects: ["Mechanics", "Optics", "Thermodynamics", "Modern Physics"],
    expertise: ["HSC Physics", "Concept Labs", "Exam Strategy"],
    experienceYears: 11,
    studentsCount: 3800,
    coursesCount: 14,
    rating: 4.8,
    reviewCount: 276,
    featured: true,
    displayOrder: 2,
    status: "ACTIVE",
  },
  {
    fullName: "Nusrat Jahan",
    title: "English Language & Literature Coach",
    shortBio:
      "Helps students write with clarity, speak with confidence, and excel in comprehension.",
    bio: "Nusrat guides learners through grammar foundations, creative writing, and literature analysis with a warm, structured approach. Her classes emphasize communication skills that extend beyond exams into academic and professional life.",
    avatarUrl:
      "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=800",
    coverUrl:
      "https://images.pexels.com/photos/159775/library-la-trobe-study-students-159775.jpeg?auto=compress&cs=tinysrgb&w=1600",
    specialty: "English",
    subjects: ["Grammar", "Composition", "Literature", "Public Speaking"],
    expertise: ["Writing Workshops", "Reading Fluency", "Board English"],
    experienceYears: 9,
    studentsCount: 2900,
    coursesCount: 12,
    rating: 4.9,
    reviewCount: 198,
    featured: true,
    displayOrder: 3,
    status: "ACTIVE",
  },
  {
    fullName: "Tanvir Ahmed",
    title: "Chemistry & Lab Skills Instructor",
    shortBio:
      "Breaks down organic and inorganic chemistry with memorable mnemonics and practical examples.",
    bio: "Tanvir's teaching philosophy centers on pattern recognition and reaction mechanisms. He helps students connect textbook theory with lab observations, making chemistry less intimidating and more intuitive for board and admission tests.",
    avatarUrl:
      "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=800",
    coverUrl:
      "https://images.pexels.com/photos/2280549/pexels-photo-2280549.jpeg?auto=compress&cs=tinysrgb&w=1600",
    specialty: "Chemistry",
    subjects: ["Organic Chemistry", "Inorganic Chemistry", "Physical Chemistry"],
    expertise: ["Reaction Maps", "Lab Safety", "Past Papers"],
    experienceYears: 10,
    studentsCount: 2600,
    coursesCount: 11,
    rating: 4.7,
    reviewCount: 164,
    featured: false,
    displayOrder: 4,
    status: "ACTIVE",
  },
  {
    fullName: "Sadia Islam",
    title: "Biology & Life Sciences Expert",
    shortBio:
      "Guides students through human physiology, genetics, and ecology with vivid visual learning.",
    bio: "Sadia specializes in making biology memorable through diagrams, case studies, and spaced repetition. Her structured revision cycles help students retain vast syllabi while developing genuine scientific curiosity.",
    avatarUrl:
      "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=800",
    coverUrl:
      "https://images.pexels.com/photos/256262/pexels-photo-256262.jpeg?auto=compress&cs=tinysrgb&w=1600",
    specialty: "Biology",
    subjects: ["Human Physiology", "Genetics", "Ecology", "Botany"],
    expertise: ["Diagram Mastery", "MCQ Drills", "Medical Prep"],
    experienceYears: 8,
    studentsCount: 2400,
    coursesCount: 10,
    rating: 4.8,
    reviewCount: 142,
    featured: false,
    displayOrder: 5,
    status: "ACTIVE",
  },
  {
    fullName: "Imran Chowdhury",
    title: "ICT & Digital Skills Lead",
    shortBio:
      "Teaches programming fundamentals, digital literacy, and practical ICT for modern learners.",
    bio: "Imran bridges the gap between syllabus requirements and real-world tech skills. From Python basics to database concepts, his sessions prepare students for both exams and future STEM pathways.",
    avatarUrl:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=800",
    coverUrl:
      "https://images.pexels.com/photos/577585/pexels-photo-577585.jpeg?auto=compress&cs=tinysrgb&w=1600",
    specialty: "ICT",
    subjects: ["Programming", "Databases", "Networking", "Web Basics"],
    expertise: ["Python", "Project-Based Learning", "Digital Safety"],
    experienceYears: 7,
    studentsCount: 1800,
    coursesCount: 9,
    rating: 4.7,
    reviewCount: 118,
    featured: false,
    displayOrder: 6,
    status: "ACTIVE",
  },
  {
    fullName: "Ayesha Khan",
    title: "Bangla Language & Culture Mentor",
    shortBio:
      "Celebrates language mastery through poetry, prose, and expressive writing workshops.",
    bio: "Ayesha helps students appreciate Bangla literature while mastering grammar and composition for examinations. Her classes blend cultural context with rigorous writing practice.",
    avatarUrl:
      "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=800",
    coverUrl:
      "https://images.pexels.com/photos/159711/books-book-pages-read-literature-159711.jpeg?auto=compress&cs=tinysrgb&w=1600",
    specialty: "Bangla",
    subjects: ["Grammar", "Essay Writing", "Poetry", "Prose Analysis"],
    expertise: ["Creative Writing", "Board Bangla", "Literary Analysis"],
    experienceYears: 12,
    studentsCount: 2100,
    coursesCount: 8,
    rating: 4.9,
    reviewCount: 156,
    featured: true,
    displayOrder: 7,
    status: "ACTIVE",
  },
  {
    fullName: "Rafiqul Islam",
    title: "Higher Mathematics Specialist",
    shortBio:
      "Coaches advanced math students for engineering admission and olympiad-level challenges.",
    bio: "Rafiqul focuses on higher mathematics with an emphasis on proof techniques, competition problems, and university admission preparation. His analytical approach builds deep mathematical thinking.",
    avatarUrl:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=800",
    coverUrl:
      "https://images.pexels.com/photos/590570/pexels-photo-590570.jpeg?auto=compress&cs=tinysrgb&w=1600",
    specialty: "Mathematics",
    subjects: ["Higher Math", "Complex Numbers", "Vectors", "Probability"],
    expertise: ["Admission Prep", "Olympiad Training", "Proof Writing"],
    experienceYears: 15,
    studentsCount: 1500,
    coursesCount: 7,
    rating: 4.8,
    reviewCount: 98,
    featured: false,
    displayOrder: 8,
    status: "ACTIVE",
  },
  {
    fullName: "Mariam Akter",
    title: "Parent Counseling & Study Coach",
    shortBio:
      "Partners with families to design sustainable study routines and academic wellness plans.",
    bio: "Mariam supports both students and guardians with personalized study planning, motivation strategies, and progress tracking. Her holistic approach reduces exam anxiety while improving consistency.",
    avatarUrl:
      "https://images.pexels.com/photos/3762800/pexels-photo-3762800.jpeg?auto=compress&cs=tinysrgb&w=800",
    coverUrl:
      "https://images.pexels.com/photos/159775/library-la-trobe-study-students-159775.jpeg?auto=compress&cs=tinysrgb&w=1600",
    specialty: "Counseling",
    subjects: ["Study Planning", "Parent Guidance", "Motivation", "Time Management"],
    expertise: ["1-on-1 Coaching", "Progress Reviews", "Exam Wellness"],
    experienceYears: 6,
    studentsCount: 980,
    coursesCount: 5,
    rating: 4.9,
    reviewCount: 87,
    featured: false,
    displayOrder: 9,
    status: "ACTIVE",
  },
];

export function getInstructorSeedData() {
  return instructors.map((instructor) => ({
    ...instructor,
    slug: instructor.slug ?? slugify(instructor.fullName),
    linkedIn: "",
    twitter: "",
    website: "",
  }));
}
