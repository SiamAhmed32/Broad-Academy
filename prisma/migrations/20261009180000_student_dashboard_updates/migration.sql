-- Study Plan / Counselling form fields
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "schoolName" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "classRoll" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "studentGroup" TEXT;

-- Editable course details page content and Facebook group backup
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "includes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "facebookGroupUrl" TEXT;

-- Admin-defined label shown instead of "Module 1", "Module 2"
ALTER TABLE "CourseModule" ADD COLUMN IF NOT EXISTS "label" TEXT;

-- Explanation video links for quiz and exam questions
ALTER TABLE "QuizQuestion" ADD COLUMN IF NOT EXISTS "explanationVideoUrl" TEXT;
ALTER TABLE "ExamQuestion" ADD COLUMN IF NOT EXISTS "explanationVideoUrl" TEXT;

-- Unique code per enrollment, used to verify Facebook group join requests
ALTER TABLE "Enrollment" ADD COLUMN IF NOT EXISTS "accessCode" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Enrollment_accessCode_key" ON "Enrollment"("accessCode");
UPDATE "Enrollment"
SET "accessCode" = 'BA-' || upper(substr(md5("id" || random()::text), 1, 8))
WHERE "accessCode" IS NULL;

-- Teachers assigned to a course
CREATE TABLE IF NOT EXISTS "CourseTeacher" (
  "courseId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourseTeacher_pkey" PRIMARY KEY ("courseId", "userId")
);
CREATE INDEX IF NOT EXISTS "CourseTeacher_userId_idx" ON "CourseTeacher"("userId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CourseTeacher_courseId_fkey') THEN
    ALTER TABLE "CourseTeacher"
      ADD CONSTRAINT "CourseTeacher_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CourseTeacher_userId_fkey') THEN
    ALTER TABLE "CourseTeacher"
      ADD CONSTRAINT "CourseTeacher_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
