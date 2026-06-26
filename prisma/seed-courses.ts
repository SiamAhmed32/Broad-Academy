import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

import { courseSeedData } from "../src/lib/courses/seed-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured.");

const db = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  for (const course of courseSeedData) {
    await db.course.upsert({
      where: { slug: course.slug },
      update: course,
      create: course,
    });
  }

  console.log(`Seeded ${courseSeedData.length} courses.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
