-- Academy notices shown to students
CREATE TABLE IF NOT EXISTS "Notice" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "linkUrl" TEXT,
  "linkLabel" TEXT,
  "pinned" BOOLEAN NOT NULL DEFAULT false,
  "published" BOOLEAN NOT NULL DEFAULT true,
  "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Notice_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "Notice_published_pinned_publishedAt_idx"
  ON "Notice"("published", "pinned", "publishedAt");

-- Admin replies to student document submissions
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "reviewedAt" TIMESTAMP(3);
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "replyFileUrl" TEXT;
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "replyFilePublicId" TEXT;
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "replyFileName" TEXT;
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "replyFileFormat" TEXT;
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "replyFileResourceType" TEXT;
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "userId" TEXT;

CREATE INDEX IF NOT EXISTS "DocumentSubmission_userId_createdAt_idx"
  ON "DocumentSubmission"("userId", "createdAt");

-- Link existing submissions to the student account with the same email
UPDATE "DocumentSubmission" AS d
SET "userId" = u."id"
FROM "User" AS u
WHERE d."userId" IS NULL AND lower(d."email") = lower(u."email");

-- Admin replies to contact messages
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "replyMessage" TEXT;
ALTER TABLE "ContactMessage" ADD COLUMN IF NOT EXISTS "repliedAt" TIMESTAMP(3);
