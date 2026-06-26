-- Student brain-break game stats and secure result sessions.
-- Run: npx prisma db execute --file prisma/patch-student-game.sql

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
  ALTER TABLE "StudentGameStats"
    ADD CONSTRAINT "StudentGameStats_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "StudentGameSession"
    ADD CONSTRAINT "StudentGameSession_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
