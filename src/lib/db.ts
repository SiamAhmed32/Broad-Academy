import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@/generated/prisma/client";

const PRISMA_CLIENT_VERSION = 9;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion: number | undefined;
};

function isStalePrismaClient(client: PrismaClient) {
  const runtimeModels = (
    client as unknown as {
      _runtimeDataModel?: { models?: Record<string, { fields?: { name: string }[] }> };
    }
  )._runtimeDataModel?.models;

  const userFields =
    runtimeModels?.User?.fields?.map((field) => field.name) ?? [];
  const requiredUserFields = [
    "adminRole",
    "permissions",
    "studentId",
    "classLevel",
    "avatarUrl",
    "avatarPublicId",
  ];
  const requiredModels = [
    "instructor",
    "course",
    "enrollment",
    "enrollmentRequest",
    "contactMessage",
    "counsellingBooking",
    "popupCampaign",
    "siteConfig",
  ] as const;

  const courseFields =
    runtimeModels?.Course?.fields?.map((field) => field.name) ?? [];

  if (requiredUserFields.some((field) => !userFields.includes(field))) {
    return true;
  }

  if (!courseFields.includes("homepageOrder")) {
    return true;
  }

  return requiredModels.some(
    (model) =>
      typeof (client as unknown as Record<string, unknown>)[model] ===
      "undefined",
  );
}

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  const cachedVersion = globalForPrisma.prismaClientVersion;

  if (
    cached &&
    (cachedVersion !== PRISMA_CLIENT_VERSION || isStalePrismaClient(cached))
  ) {
    void cached.$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
    globalForPrisma.prismaClientVersion = undefined;
  }

  if (!globalForPrisma.prisma) {
    globalForPrisma.prisma = createPrismaClient();
    globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  }

  return globalForPrisma.prisma;
}

export const db = getPrismaClient();
