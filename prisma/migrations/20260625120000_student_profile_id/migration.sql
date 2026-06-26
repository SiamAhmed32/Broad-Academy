ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "studentId" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "classLevel" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "avatarPublicId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "User_studentId_key" ON "User"("studentId");
CREATE INDEX IF NOT EXISTS "User_studentId_idx" ON "User"("studentId");

ALTER TABLE "EnrollmentRequest" ADD COLUMN IF NOT EXISTS "classLevel" INTEGER;
UPDATE "EnrollmentRequest" SET "classLevel" = 6 WHERE "classLevel" IS NULL;
ALTER TABLE "EnrollmentRequest" ALTER COLUMN "classLevel" SET NOT NULL;
