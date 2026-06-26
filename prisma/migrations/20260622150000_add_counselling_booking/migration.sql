-- CreateEnum
CREATE TYPE "CounsellingStatus" AS ENUM (
  'PENDING',
  'CONFIRMED',
  'COMPLETED',
  'CANCELLED'
);

-- CreateTable
CREATE TABLE "CounsellingBooking" (
  "id" TEXT NOT NULL,
  "fullName" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "educationLevel" TEXT NOT NULL,
  "subjectInterest" TEXT NOT NULL,
  "preferredDate" TIMESTAMP(3) NOT NULL,
  "preferredTime" TEXT NOT NULL,
  "message" TEXT,
  "status" "CounsellingStatus" NOT NULL DEFAULT 'PENDING',
  "ipHash" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CounsellingBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CounsellingBooking_email_createdAt_idx"
ON "CounsellingBooking"("email", "createdAt");

-- CreateIndex
CREATE INDEX "CounsellingBooking_status_createdAt_idx"
ON "CounsellingBooking"("status", "createdAt");

-- CreateIndex
CREATE INDEX "CounsellingBooking_createdAt_idx"
ON "CounsellingBooking"("createdAt");

-- CreateIndex
CREATE INDEX "CounsellingBooking_preferredDate_idx"
ON "CounsellingBooking"("preferredDate");
