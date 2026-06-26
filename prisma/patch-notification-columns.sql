-- Run this if Notification table already exists:
--   npx prisma db execute --file prisma/patch-notification-columns.sql

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'UPDATE';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS "Notification_userId_read_createdAt_idx";
CREATE INDEX IF NOT EXISTS "Notification_userId_archived_read_createdAt_idx" ON "Notification"("userId", "archived", "read", "createdAt");
