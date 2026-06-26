import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured.");

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });
const courseSlug = process.env.LEARNING_COURSE_SLUG ?? "class-10-physics-board-prep";
const demoEmail = process.env.LEARNING_DEMO_EMAIL?.trim().toLowerCase();

const modules = [
  {
    title: "Orientation and measurement",
    description: "Set up your study plan and refresh the language of physics.",
    lessons: [
      {
        slug: "welcome-to-ssc-physics",
        title: "Welcome and how to use this course",
        description: "Understand the course structure, practice routine, and board-exam strategy.",
        youtubeVideoId: "M7lc1UVf-VE",
        durationSeconds: 540,
        content: "In this lesson you will set a realistic weekly study target and learn how video lessons, practice resources, and quizzes work together.\n\nKeep a dedicated physics notebook and pause the lesson whenever you need to solve an example yourself.",
        resources: [
          { title: "Physics study checklist", url: "https://www.khanacademy.org/science/physics" },
        ],
      },
      {
        slug: "physical-quantities-and-units",
        title: "Physical quantities, units, and measurement",
        description: "Review SI units, prefixes, measuring instruments, and significant figures.",
        youtubeVideoId: "M7lc1UVf-VE",
        durationSeconds: 1320,
        content: "Focus on choosing the correct unit, converting between prefixes, and writing a measured result with suitable precision.",
        resources: [],
      },
      {
        slug: "measurement-quiz",
        title: "Measurement checkpoint quiz",
        description: "Check your understanding of units, instruments, and measurement errors.",
        type: "QUIZ" as const,
        durationSeconds: 600,
        resources: [],
        quiz: {
          title: "Measurement checkpoint",
          description: "Choose the best answer for each question.",
          questions: [
            {
              prompt: "Which is the SI unit of force?",
              explanation: "Force is measured in newtons (N), equivalent to kg·m/s².",
              options: ["Joule", "Newton", "Watt", "Pascal"],
              correct: 1,
            },
            {
              prompt: "Which instrument is best suited to measure the diameter of a thin wire?",
              explanation: "A screw gauge measures very small diameters more precisely than a ruler.",
              options: ["Metre scale", "Stopwatch", "Screw gauge", "Spring balance"],
              correct: 2,
            },
          ],
        },
      },
    ],
  },
  {
    title: "Motion and force",
    description: "Build the core mechanics concepts used throughout SSC physics.",
    lessons: [
      {
        slug: "distance-displacement-speed-velocity",
        title: "Distance, displacement, speed, and velocity",
        description: "Distinguish scalar and vector motion quantities through visual examples.",
        youtubeVideoId: "M7lc1UVf-VE",
        durationSeconds: 1560,
        content: "Draw a simple path diagram for every displacement problem. The shortest directed line from start to finish represents displacement.",
        resources: [],
      },
      {
        slug: "motion-graphs",
        title: "Reading and drawing motion graphs",
        description: "Interpret displacement-time and velocity-time graphs confidently.",
        youtubeVideoId: "M7lc1UVf-VE",
        durationSeconds: 1740,
        content: "The slope and area of a graph carry physical meaning. Label axes and units before calculating anything.",
        resources: [],
      },
      {
        slug: "newtons-laws",
        title: "Newton’s laws and everyday applications",
        description: "Connect inertia, acceleration, and action-reaction pairs to familiar situations.",
        youtubeVideoId: "M7lc1UVf-VE",
        durationSeconds: 1680,
        content: "For numerical problems, begin with a free-body diagram and write the known quantities before selecting an equation.",
        resources: [],
      },
    ],
  },
  {
    title: "Energy and board preparation",
    description: "Apply concepts to numericals, creative questions, and timed revision.",
    lessons: [
      {
        slug: "work-power-energy",
        title: "Work, power, and energy",
        description: "Solve work-energy calculations and compare energy transformations.",
        youtubeVideoId: "M7lc1UVf-VE",
        durationSeconds: 1800,
        content: "Always check whether force and displacement act in the same direction before using W = Fs.",
        resources: [],
      },
      {
        slug: "board-question-workshop",
        title: "Board-question solving workshop",
        description: "Use a clear step-by-step method for CQ, MCQ, and numerical answers.",
        youtubeVideoId: "M7lc1UVf-VE",
        durationSeconds: 2100,
        content: "Show the formula, substitution, calculation, unit, and final statement. This makes numerical answers easy to review and earns method marks.",
        resources: [],
      },
    ],
  },
];

async function main() {
  const course = await db.course.findUnique({ where: { slug: courseSlug } });
  if (!course) throw new Error(`Course not found: ${courseSlug}`);

  await db.courseModule.deleteMany({ where: { courseId: course.id } });

  for (const [moduleIndex, module] of modules.entries()) {
    const createdModule = await db.courseModule.create({
      data: {
        courseId: course.id,
        title: module.title,
        description: module.description,
        displayOrder: moduleIndex,
      },
    });

    for (const [lessonIndex, lesson] of module.lessons.entries()) {
      const createdLesson = await db.lesson.create({
        data: {
          moduleId: createdModule.id,
          slug: lesson.slug,
          title: lesson.title,
          description: lesson.description,
          type: lesson.type ?? "VIDEO",
          youtubeVideoId: lesson.youtubeVideoId ?? null,
          durationSeconds: lesson.durationSeconds,
          content: lesson.content ?? null,
          displayOrder: lessonIndex,
          resources: {
            create: lesson.resources.map((resource, resourceIndex) => ({
              ...resource,
              displayOrder: resourceIndex,
            })),
          },
        },
      });

      if (lesson.quiz) {
        await db.quiz.create({
          data: {
            lessonId: createdLesson.id,
            title: lesson.quiz.title,
            description: lesson.quiz.description,
            passPercent: 60,
            questions: {
              create: lesson.quiz.questions.map((question, questionIndex) => ({
                prompt: question.prompt,
                explanation: question.explanation,
                displayOrder: questionIndex,
                options: {
                  create: question.options.map((text, optionIndex) => ({
                    text,
                    isCorrect: optionIndex === question.correct,
                    displayOrder: optionIndex,
                  })),
                },
              })),
            },
          },
        });
      }
    }
  }

  if (demoEmail) {
    const user = await db.user.findUnique({ where: { email: demoEmail } });
    if (!user) throw new Error(`Demo user not found: ${demoEmail}`);
    await db.enrollment.upsert({
      where: { userId_courseId: { userId: user.id, courseId: course.id } },
      update: { status: "ACTIVE", expiresAt: null },
      create: { userId: user.id, courseId: course.id, status: "ACTIVE" },
    });
    console.log(`Enrolled ${demoEmail} in ${course.title}.`);
  }

  console.log(`Seeded ${modules.length} modules for ${course.title}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
