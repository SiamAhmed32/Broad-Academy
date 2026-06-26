-- Homepage course priority column
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "homepageOrder" INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS "Course_status_featured_homepageOrder_idx" ON "Course"("status", "featured", "homepageOrder");
