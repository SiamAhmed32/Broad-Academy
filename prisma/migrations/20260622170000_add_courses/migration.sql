-- CreateEnum
CREATE TYPE "CourseStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CourseLevel" AS ENUM (
  'CLASS_6',
  'CLASS_7',
  'CLASS_8',
  'CLASS_9',
  'CLASS_10',
  'CLASS_11',
  'CLASS_12'
);

-- CreateTable
CREATE TABLE "Course" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "level" "CourseLevel" NOT NULL,
  "subject" TEXT NOT NULL,
  "instructorName" TEXT NOT NULL,
  "thumbnailUrl" TEXT NOT NULL,
  "price" INTEGER NOT NULL,
  "originalPrice" INTEGER,
  "durationMinutes" INTEGER NOT NULL,
  "lessonCount" INTEGER NOT NULL,
  "rating" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "reviewCount" INTEGER NOT NULL DEFAULT 0,
  "studentsCount" INTEGER NOT NULL DEFAULT 0,
  "featured" BOOLEAN NOT NULL DEFAULT false,
  "badge" TEXT,
  "status" "CourseStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Course_slug_key" ON "Course"("slug");

-- CreateIndex
CREATE INDEX "Course_status_category_idx" ON "Course"("status", "category");

-- CreateIndex
CREATE INDEX "Course_status_level_idx" ON "Course"("status", "level");

-- CreateIndex
CREATE INDEX "Course_status_featured_idx" ON "Course"("status", "featured");

-- CreateIndex
CREATE INDEX "Course_status_publishedAt_idx" ON "Course"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Course_status_rating_idx" ON "Course"("status", "rating");

-- CreateIndex
CREATE INDEX "Course_category_level_idx" ON "Course"("category", "level");

-- PostgreSQL full-text search index for the public course catalogue.
CREATE INDEX "Course_search_idx"
ON "Course"
USING GIN (
  to_tsvector(
    'english',
    coalesce("title", '') || ' ' ||
    coalesce("shortDescription", '') || ' ' ||
    coalesce("category", '') || ' ' ||
    coalesce("subject", '') || ' ' ||
    coalesce("instructorName", '')
  )
);
