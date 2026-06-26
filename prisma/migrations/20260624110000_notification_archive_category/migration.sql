-- Safe patch: Notification table already exists from an earlier deploy.
-- Adds archive + category support required by the notification modal.

ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'UPDATE';
ALTER TABLE "Notification" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;

DROP INDEX IF EXISTS "Notification_userId_read_createdAt_idx";
CREATE INDEX IF NOT EXISTS "Notification_userId_archived_read_createdAt_idx" ON "Notification"("userId", "archived", "read", "createdAt");
