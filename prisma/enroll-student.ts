import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { z } from "zod";

const inputSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  courseSlug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
});

const parsed = inputSchema.safeParse({
  email: process.argv[2],
  courseSlug: process.argv[3],
});

if (!parsed.success) {
  throw new Error(
    "Usage: npm run db:enroll -- student@example.com course-slug",
  );
}
const input = parsed.data;

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured.");

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

async function main() {
  const [user, course] = await Promise.all([
    db.user.findUnique({
      where: { email: input.email },
      select: { id: true, fullName: true, status: true },
    }),
    db.course.findUnique({
      where: { slug: input.courseSlug },
      select: { id: true, title: true, status: true },
    }),
  ]);

  if (!user || user.status !== "ACTIVE") {
    throw new Error("An active student with that email was not found.");
  }
  if (!course || course.status !== "PUBLISHED") {
    throw new Error("A published course with that slug was not found.");
  }

  await db.enrollment.upsert({
    where: { userId_courseId: { userId: user.id, courseId: course.id } },
    update: {
      status: "ACTIVE",
      expiresAt: null,
      completedAt: null,
    },
    create: {
      userId: user.id,
      courseId: course.id,
      status: "ACTIVE",
    },
  });

  console.log(`Enrolled ${user.fullName} in ${course.title}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
