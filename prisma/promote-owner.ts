import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";
import { z } from "zod";

const emailSchema = z.string().trim().toLowerCase().email();
const parsed = emailSchema.safeParse(process.argv[2]);

if (!parsed.success) {
  throw new Error(
    "Usage: npm run db:promote-owner -- owner@example.com",
  );
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured.");

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

async function main() {
  const account = await db.user.findUnique({
    where: { email: parsed.data },
    select: {
      id: true,
      fullName: true,
      email: true,
      role: true,
      adminRole: true,
      status: true,
    },
  });

  if (!account) {
    throw new Error("No registered account exists with that email.");
  }
  if (account.status !== "ACTIVE") {
    throw new Error("The account must be active before it can become Owner.");
  }

  const existingOwner = await db.user.findFirst({
    where: {
      role: "ADMIN",
      adminRole: "OWNER",
      id: { not: account.id },
    },
    select: { email: true },
  });

  if (existingOwner && process.env.ALLOW_ADDITIONAL_OWNER !== "true") {
    throw new Error(
      `An Owner already exists (${existingOwner.email}). ` +
        "Set ALLOW_ADDITIONAL_OWNER=true only if a second Owner is intentional.",
    );
  }

  const [owner] = await db.$transaction([
    db.user.update({
      where: { id: account.id },
      data: {
        role: "ADMIN",
        adminRole: "OWNER",
        permissions: [],
      },
      select: {
        fullName: true,
        email: true,
        role: true,
        adminRole: true,
      },
    }),
    db.session.deleteMany({ where: { userId: account.id } }),
  ]);

  console.log(
    `Owner ready: ${owner.fullName} <${owner.email}> (${owner.role}/${owner.adminRole}).`,
  );
  console.log("Existing sessions were revoked. Sign in again.");
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
