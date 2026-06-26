-- Full idempotent database patch for Broad Academy.
-- Run: npx prisma db execute --file prisma/patch-consolidated.sql

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'UPDATE';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
DROP INDEX IF EXISTS "Notification_userId_read_createdAt_idx";
CREATE INDEX IF NOT EXISTS "Notification_userId_archived_read_createdAt_idx" ON "Notification"("userId", "archived", "read", "createdAt");

ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "meetingLink" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "counsellorNotes" TEXT;
CREATE INDEX IF NOT EXISTS "CounsellingBooking_userId_idx" ON "CounsellingBooking"("userId");

CREATE TABLE IF NOT EXISTS "CounsellingFile" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileKey" TEXT NOT NULL,
    "uploadedByRole" TEXT NOT NULL,
    "uploadedById" TEXT NOT NULL,
    "uploadedByName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CounsellingFile_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "CounsellingFile_bookingId_idx" ON "CounsellingFile"("bookingId");

CREATE TABLE IF NOT EXISTS "Announcement" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "badge" TEXT,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "bgGradient" TEXT NOT NULL DEFAULT 'from-btnBg to-[#005fc7]',
    "textColor" TEXT NOT NULL DEFAULT 'text-white',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "timeLimitSeconds" INTEGER;

CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "EmailVerificationToken_tokenHash_key" ON "EmailVerificationToken"("tokenHash");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_userId_idx" ON "EmailVerificationToken"("userId");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_email_createdAt_idx" ON "EmailVerificationToken"("email", "createdAt");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_expiresAt_idx" ON "EmailVerificationToken"("expiresAt");

-- Counselling payment tracking
DO $$ BEGIN
  CREATE TYPE "CounsellingPaymentStatus" AS ENUM ('UNQUOTED', 'AWAITING_PAYMENT', 'PROOF_SUBMITTED', 'PAID', 'WAIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "sessionFee" INTEGER;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "feeQuotedAt" TIMESTAMP(3);
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paymentStatus" "CounsellingPaymentStatus" NOT NULL DEFAULT 'UNQUOTED';
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "bkashSenderNumber" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "bkashTransactionId" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paymentProofPublicId" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paymentProofFormat" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paymentSubmittedAt" TIMESTAMP(3);
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paymentNote" TEXT;
CREATE INDEX IF NOT EXISTS "CounsellingBooking_paymentStatus_idx" ON "CounsellingBooking"("paymentStatus");

-- Student ID, class level, avatar
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studentId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "classLevel" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarPublicId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_studentId_key" ON "User"("studentId");
CREATE INDEX IF NOT EXISTS "User_studentId_idx" ON "User"("studentId");

ALTER TABLE "EnrollmentRequest" ADD COLUMN IF NOT EXISTS "classLevel" INTEGER;
UPDATE "EnrollmentRequest" SET "classLevel" = 6 WHERE "classLevel" IS NULL;
ALTER TABLE "EnrollmentRequest" ALTER COLUMN "classLevel" SET NOT NULL;

-- Homepage course priority (lower = shown first among featured courses)
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "homepageOrder" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Course_status_featured_homepageOrder_idx" ON "Course"("status", "featured", "homepageOrder");

CREATE TABLE IF NOT EXISTS "SiteConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enrollmentGuideYoutubeUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);
INSERT INTO "SiteConfig" ("id", "updatedAt")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- One active video player per student account
CREATE TABLE IF NOT EXISTS "LearningWatchLock" (
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "courseSlug" TEXT NOT NULL,
    "lessonSlug" TEXT NOT NULL,
    "lastHeartbeat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LearningWatchLock_pkey" PRIMARY KEY ("userId")
);
CREATE INDEX IF NOT EXISTS "LearningWatchLock_sessionId_idx" ON "LearningWatchLock"("sessionId");
CREATE INDEX IF NOT EXISTS "LearningWatchLock_lastHeartbeat_idx" ON "LearningWatchLock"("lastHeartbeat");
DO $$ BEGIN
  ALTER TABLE "LearningWatchLock"
    ADD CONSTRAINT "LearningWatchLock_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Lesson slugs are unique per section (module), not globally
DROP INDEX IF EXISTS "Lesson_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Lesson_moduleId_slug_key" ON "Lesson"("moduleId", "slug");

CREATE TABLE IF NOT EXISTS "StudentGameStats" (
    "userId" TEXT NOT NULL,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "draws" INTEGER NOT NULL DEFAULT 0,
    "gamesPlayed" INTEGER NOT NULL DEFAULT 0,
    "winStreak" INTEGER NOT NULL DEFAULT 0,
    "bestWinStreak" INTEGER NOT NULL DEFAULT 0,
    "lastPlayedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentGameStats_pkey" PRIMARY KEY ("userId")
);
CREATE TABLE IF NOT EXISTS "StudentGameSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    CONSTRAINT "StudentGameSession_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "StudentGameSession_userId_createdAt_idx" ON "StudentGameSession"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "StudentGameSession_expiresAt_idx" ON "StudentGameSession"("expiresAt");
DO $$ BEGIN
  ALTER TABLE "StudentGameStats" ADD CONSTRAINT "StudentGameStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "StudentGameSession" ADD CONSTRAINT "StudentGameSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "filePublicId" TEXT;
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "fileFormat" TEXT;
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "fileName" TEXT;
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "fileResourceType" TEXT;
