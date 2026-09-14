ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "examCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "Exam" ADD COLUMN IF NOT EXISTS "courseId" TEXT;

CREATE INDEX IF NOT EXISTS "Exam_courseId_idx" ON "Exam"("courseId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Exam_courseId_fkey'
  ) THEN
    ALTER TABLE "Exam"
      ADD CONSTRAINT "Exam_courseId_fkey"
      FOREIGN KEY ("courseId") REFERENCES "Course"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;
END $$;
