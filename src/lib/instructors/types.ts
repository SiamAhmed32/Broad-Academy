export type PublicInstructorCard = {
  id: string;
  slug: string;
  fullName: string;
  title: string;
  shortBio: string;
  avatarUrl: string;
  specialty: string;
  subjects: string[];
  experienceYears: number;
  studentsCount: number;
  coursesCount: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
};

export type PublicInstructor = PublicInstructorCard & {
  bio: string;
  coverUrl: string | null;
  expertise: string[];
  linkedIn: string | null;
  twitter: string | null;
  website: string | null;
  createdAt: string;
};

export type RelatedInstructor = {
  id: string;
  slug: string;
  fullName: string;
  title: string;
  shortBio: string;
  avatarUrl: string;
  specialty: string;
  subjects: string[];
  experienceYears: number;
  studentsCount: number;
  coursesCount: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
};

export type InstructorsListResponse = {
  success: boolean;
  data: {
    instructors: PublicInstructorCard[];
    specialties: string[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
};

export type InstructorDetailResponse = {
  success: boolean;
  data: {
    instructor: PublicInstructor;
    related: RelatedInstructor[];
  };
};
