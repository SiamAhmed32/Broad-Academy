-- Actual counselling session date/time, set by staff
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "scheduledAt" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "CounsellingBooking_scheduledAt_idx" ON "CounsellingBooking"("scheduledAt");

-- SSC exam year (cohort) of each student, e.g. 2027 for the "SSC 2027 batch"
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "sscBatch" INTEGER;
CREATE INDEX IF NOT EXISTS "User_sscBatch_idx" ON "User"("sscBatch");

-- Derive the batch from the class students already gave (Bangladesh school year
-- runs Jan–Dec; the HSC session starts around July).
UPDATE "User"
SET "sscBatch" = CASE
  WHEN "classLevel" BETWEEN 1 AND 10
    THEN EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'Asia/Dhaka'))::int + 11 - "classLevel"
  WHEN "classLevel" = 11
    THEN EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'Asia/Dhaka'))::int
      - CASE WHEN EXTRACT(MONTH FROM (NOW() AT TIME ZONE 'Asia/Dhaka')) >= 7 THEN 0 ELSE 1 END
  WHEN "classLevel" = 12
    THEN EXTRACT(YEAR FROM (NOW() AT TIME ZONE 'Asia/Dhaka'))::int
      - CASE WHEN EXTRACT(MONTH FROM (NOW() AT TIME ZONE 'Asia/Dhaka')) >= 7 THEN 1 ELSE 2 END
END
WHERE "sscBatch" IS NULL AND "classLevel" BETWEEN 1 AND 12;
