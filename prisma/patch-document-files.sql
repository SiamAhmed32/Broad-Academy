-- Document submission file metadata for secure view/download links.
-- Run: npx prisma db execute --file prisma/patch-document-files.sql

ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "filePublicId" TEXT;
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "fileFormat" TEXT;
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "fileName" TEXT;
ALTER TABLE "DocumentSubmission" ADD COLUMN IF NOT EXISTS "fileResourceType" TEXT;
