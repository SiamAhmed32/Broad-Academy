import "dotenv/config";

import { db } from "@/lib/db";
import { slugify } from "@/lib/instructors/utils";

const instructors = [
  {
    fullName: "Jarif Joarder",
    title: "Physics Instructor",
    specialty: "Physics",
    avatarUrl:
      "https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    fullName: "Dipit Saha",
    title: "Mathematics Instructor",
    specialty: "Mathematics",
    avatarUrl:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    fullName: "Md Mehedi Hasan Khan",
    title: "Chemistry Instructor",
    specialty: "Chemistry",
    avatarUrl:
      "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    fullName: "Tanvir Ahmed",
    title: "Higher Mathematics Instructor",
    specialty: "Higher Mathematics",
    avatarUrl:
      "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    fullName: "Mahadi Hasan",
    title: "Biology Instructor",
    specialty: "Biology",
    avatarUrl:
      "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    fullName: "Sabbir Rahman",
    title: "ICT Instructor",
    specialty: "ICT",
    avatarUrl:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    fullName: "Nusrat Jahan",
    title: "English Instructor",
    specialty: "English",
    avatarUrl:
      "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    fullName: "Hasan Mahmud",
    title: "Bangla Instructor",
    specialty: "Bangla",
    avatarUrl:
      "https://images.pexels.com/photos/936119/pexels-photo-936119.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

const mentors = [
  {
    fullName: "Ariful Islam",
    title: "Academic Mentor",
    shortBio: "Guides students in academic planning and helps them achieve their goals.",
    avatarUrl:
      "https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    fullName: "Sadia Afrin",
    title: "Learning Support Mentor",
    shortBio: "Supports students in their learning journey and study strategies.",
    avatarUrl:
      "https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    fullName: "Fahim Hossain",
    title: "Career Guidance Mentor",
    shortBio: "Provides career guidance and helps students plan their future.",
    avatarUrl:
      "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    fullName: "Tahsina Akter",
    title: "Student Support Specialist",
    shortBio: "Assists students with their queries and ensures smooth support.",
    avatarUrl:
      "https://images.pexels.com/photos/3756679/pexels-photo-3756679.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
];

async function main() {
  await db.instructor.deleteMany();

  let order = 1;

  for (const item of instructors) {
    await db.instructor.create({
      data: {
        slug: slugify(item.fullName),
        fullName: item.fullName,
        title: item.title,
        shortBio: `${item.title} at Broad Academy, dedicated to helping students learn and grow.`,
        bio: `${item.fullName} is an experienced ${item.title.toLowerCase()} at Broad Academy, dedicated to helping students build strong fundamentals and achieve their academic goals through clear, structured teaching.`,
        avatarUrl: item.avatarUrl,
        specialty: item.specialty,
        subjects: [item.specialty],
        expertise: [item.specialty],
        experienceYears: 5,
        studentsCount: 500,
        coursesCount: 3,
        rating: 4.8,
        reviewCount: 50,
        featured: false,
        displayOrder: order++,
        status: "ACTIVE",
        memberType: "INSTRUCTOR",
        facebookUrl: "https://facebook.com/broadacademy",
        youtubeUrl: "https://youtube.com/@broadacademy",
      },
    });
  }

  for (const item of mentors) {
    await db.instructor.create({
      data: {
        slug: slugify(item.fullName),
        fullName: item.fullName,
        title: item.title,
        shortBio: item.shortBio,
        bio: `${item.fullName} works as a ${item.title.toLowerCase()} at Broad Academy. ${item.shortBio}`,
        avatarUrl: item.avatarUrl,
        specialty: "Student Support",
        subjects: [],
        expertise: [],
        experienceYears: 3,
        studentsCount: 300,
        coursesCount: 0,
        rating: 4.9,
        reviewCount: 20,
        featured: false,
        displayOrder: order++,
        status: "ACTIVE",
        memberType: "MENTOR",
        facebookUrl: "https://facebook.com/broadacademy",
        youtubeUrl: "https://youtube.com/@broadacademy",
      },
    });
  }

  console.log(`Seeded ${instructors.length} instructors and ${mentors.length} mentors.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
