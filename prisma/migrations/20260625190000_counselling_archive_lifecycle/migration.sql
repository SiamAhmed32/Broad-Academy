ALTER TABLE "CounsellingBooking"
  ADD COLUMN IF NOT EXISTS "archivedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "archivedById" TEXT;

CREATE INDEX IF NOT EXISTS "CounsellingBooking_archivedAt_createdAt_idx"
  ON "CounsellingBooking"("archivedAt", "createdAt");

CREATE INDEX IF NOT EXISTS "CounsellingBooking_subjectInterest_idx"
  ON "CounsellingBooking"("subjectInterest");

CREATE INDEX IF NOT EXISTS "CounsellingBooking_educationLevel_idx"
  ON "CounsellingBooking"("educationLevel");
