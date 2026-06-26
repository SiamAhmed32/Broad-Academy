-- Site-wide enrollment guide video URL (YouTube)
CREATE TABLE IF NOT EXISTS "SiteConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "enrollmentGuideYoutubeUrl" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SiteConfig_pkey" PRIMARY KEY ("id")
);
INSERT INTO "SiteConfig" ("id", "updatedAt")
VALUES ('default', CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;
