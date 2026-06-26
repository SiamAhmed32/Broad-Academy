-- CreateEnum
CREATE TYPE "AdminStaffRole" AS ENUM ('SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_STAFF');
CREATE TYPE "NoticeStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "NoticeAudience" AS ENUM ('ALL', 'STUDENTS', 'PARENTS');
CREATE TYPE "DocumentSubmissionStatus" AS ENUM ('PENDING', 'REVIEWED', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "adminRole" "AdminStaffRole",
ADD COLUMN "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- CreateIndex
CREATE INDEX "User_adminRole_idx" ON "User"("adminRole");

-- CreateTable
CREATE TABLE "Notice" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "audience" "NoticeAudience" NOT NULL DEFAULT 'ALL',
    "status" "NoticeStatus" NOT NULL DEFAULT 'DRAFT',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentSubmission" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "documentType" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "message" TEXT,
    "status" "DocumentSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notice_status_createdAt_idx" ON "Notice"("status", "createdAt");
CREATE INDEX "Notice_publishedAt_idx" ON "Notice"("publishedAt");
CREATE INDEX "DocumentSubmission_status_createdAt_idx" ON "DocumentSubmission"("status", "createdAt");
CREATE INDEX "DocumentSubmission_email_createdAt_idx" ON "DocumentSubmission"("email", "createdAt");
