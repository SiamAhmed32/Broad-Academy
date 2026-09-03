-- CreateEnum
CREATE TYPE "InstructorType" AS ENUM ('INSTRUCTOR', 'MENTOR');

-- AlterTable
ALTER TABLE "Instructor" ADD COLUMN "memberType" "InstructorType" NOT NULL DEFAULT 'INSTRUCTOR';
ALTER TABLE "Instructor" ADD COLUMN "facebookUrl" TEXT;
ALTER TABLE "Instructor" ADD COLUMN "youtubeUrl" TEXT;

-- CreateIndex
CREATE INDEX "Instructor_memberType_idx" ON "Instructor"("memberType");
