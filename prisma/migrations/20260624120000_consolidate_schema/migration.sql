-- Idempotent schema consolidation for environments that drifted from migrations.

-- CounsellingBooking extensions
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "userId" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "meetingLink" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "counsellorNotes" TEXT;
CREATE INDEX IF NOT EXISTS "CounsellingBooking_userId_idx" ON "CounsellingBooking"("userId");
DO $$ BEGIN
  ALTER TABLE "CounsellingBooking" ADD CONSTRAINT "CounsellingBooking_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CounsellingFile
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
DO $$ BEGIN
  ALTER TABLE "CounsellingFile" ADD CONSTRAINT "CounsellingFile_bookingId_fkey"
    FOREIGN KEY ("bookingId") REFERENCES "CounsellingBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Announcement
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
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- Quiz timed exams
ALTER TABLE "Quiz" ADD COLUMN IF NOT EXISTS "timeLimitSeconds" INTEGER;

-- Email verification tokens
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
DO $$ BEGIN
  ALTER TABLE "EmailVerificationToken" ADD CONSTRAINT "EmailVerificationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
