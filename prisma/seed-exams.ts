import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

import { examSeedData } from "../src/lib/exams/seed-data";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured.");

const db = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
});

async function main() {
  for (const exam of examSeedData) {
    await db.exam.upsert({
      where: { slug: exam.slug },
      update: exam,
      create: exam,
    });
  }

  console.log(`Seeded ${examSeedData.length} exams.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
