-- Lesson slugs are unique per section (module), not globally.
-- Run: npx prisma db execute --file prisma/patch-lesson-slug-scope.sql

DROP INDEX IF EXISTS "Lesson_slug_key";
CREATE UNIQUE INDEX IF NOT EXISTS "Lesson_moduleId_slug_key" ON "Lesson"("moduleId", "slug");
