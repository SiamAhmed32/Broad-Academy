import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

import { getInstructorSeedData } from "../src/lib/instructors/seed-data";
import { emptyToNull } from "../src/lib/instructors/utils";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not configured.");
}

const adapter = new PrismaNeon({ connectionString });
const db = new PrismaClient({ adapter });

async function main() {
  const seedData = getInstructorSeedData();

  await db.instructor.deleteMany();

  for (const instructor of seedData) {
    await db.instructor.create({
      data: {
        slug: instructor.slug,
        fullName: instructor.fullName,
        title: instructor.title,
        shortBio: instructor.shortBio,
        bio: instructor.bio,
        avatarUrl: instructor.avatarUrl,
        coverUrl: emptyToNull(instructor.coverUrl),
        specialty: instructor.specialty,
        subjects: instructor.subjects,
        expertise: instructor.expertise,
        experienceYears: instructor.experienceYears,
        studentsCount: instructor.studentsCount,
        coursesCount: instructor.coursesCount,
        rating: instructor.rating,
        reviewCount: instructor.reviewCount,
        featured: instructor.featured,
        displayOrder: instructor.displayOrder,
        status: instructor.status,
        linkedIn: emptyToNull(instructor.linkedIn),
        twitter: emptyToNull(instructor.twitter),
        website: emptyToNull(instructor.website),
      },
    });
  }

  const count = await db.instructor.count();
  console.log(`Seeded ${count} instructors.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
