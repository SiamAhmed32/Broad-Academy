CREATE TYPE "EnrollmentSource" AS ENUM ('MANUAL_PAYMENT', 'ADMIN_DIRECT', 'LEGACY');
CREATE TYPE "EnrollmentRequestStatus" AS ENUM ('PENDING', 'REVIEWING', 'APPROVED', 'REJECTED', 'CANCELLED');

ALTER TABLE "Enrollment"
ADD COLUMN "source" "EnrollmentSource" NOT NULL DEFAULT 'LEGACY',
ADD COLUMN "grantedById" TEXT,
ADD COLUMN "grantNote" TEXT,
ADD COLUMN "grantedAt" TIMESTAMP(3);

CREATE TABLE "EnrollmentRequest" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "status" "EnrollmentRequestStatus" NOT NULL DEFAULT 'PENDING',
  "studentPhone" TEXT NOT NULL,
  "guardianPhone" TEXT NOT NULL,
  "bkashSenderNumber" TEXT NOT NULL,
  "bkashTransactionId" TEXT NOT NULL,
  "paidAmount" INTEGER NOT NULL,
  "paymentProofPublicId" TEXT NOT NULL,
  "paymentProofFormat" TEXT NOT NULL,
  "paymentProofVersion" INTEGER NOT NULL,
  "paymentProofBytes" INTEGER NOT NULL,
  "studentNote" TEXT,
  "reviewedById" TEXT,
  "reviewNote" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "EnrollmentRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "EnrollmentRequest_userId_courseId_key" ON "EnrollmentRequest"("userId", "courseId");
CREATE UNIQUE INDEX "EnrollmentRequest_bkashTransactionId_key" ON "EnrollmentRequest"("bkashTransactionId");
CREATE INDEX "EnrollmentRequest_status_submittedAt_idx" ON "EnrollmentRequest"("status", "submittedAt");
CREATE INDEX "EnrollmentRequest_courseId_status_idx" ON "EnrollmentRequest"("courseId", "status");
CREATE INDEX "EnrollmentRequest_reviewedById_idx" ON "EnrollmentRequest"("reviewedById");
CREATE INDEX "Enrollment_source_status_idx" ON "Enrollment"("source", "status");
CREATE INDEX "Enrollment_grantedById_idx" ON "Enrollment"("grantedById");

ALTER TABLE "Enrollment"
ADD CONSTRAINT "Enrollment_grantedById_fkey"
FOREIGN KEY ("grantedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "EnrollmentRequest"
ADD CONSTRAINT "EnrollmentRequest_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EnrollmentRequest"
ADD CONSTRAINT "EnrollmentRequest_courseId_fkey"
FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EnrollmentRequest"
ADD CONSTRAINT "EnrollmentRequest_reviewedById_fkey"
FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
