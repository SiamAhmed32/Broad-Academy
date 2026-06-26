import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "../src/generated/prisma/client";

const email = process.env.ADMIN_EMAIL ?? "admin@broadacademy.com";
const password = process.env.ADMIN_PASSWORD ?? "Admin@12345";
const name = process.env.ADMIN_NAME ?? "Broad Academy Admin";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not configured.");

const db = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

async function main() {
  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await db.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      adminRole: "OWNER",
      permissions: [],
      status: "ACTIVE",
      passwordHash,
      fullName: name,
    },
    create: {
      email,
      fullName: name,
      passwordHash,
      role: "ADMIN",
      adminRole: "OWNER",
      permissions: [],
      status: "ACTIVE",
    },
  });

  console.log(`Admin ready: ${admin.email} (${admin.adminRole})`);
  console.log("Default password (change after first login):", password);
}

main()
  .catch(console.error)
  .finally(() => db.$disconnect());
