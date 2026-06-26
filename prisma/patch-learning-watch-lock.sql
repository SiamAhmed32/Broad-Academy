-- One active video player per student account.
-- Run: npx prisma db execute --file prisma/patch-learning-watch-lock.sql

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
