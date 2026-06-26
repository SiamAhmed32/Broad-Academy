CREATE TYPE "PopupCampaignStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "PopupCampaignAudience" AS ENUM ('ALL', 'GUESTS', 'STUDENTS');
CREATE TYPE "PopupCampaignFrequency" AS ENUM ('ONCE_PER_CAMPAIGN', 'ONCE_PER_SESSION', 'EVERY_VISIT');

CREATE TABLE "PopupCampaign" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "badge" TEXT,
    "imageUrl" TEXT,
    "ctaText" TEXT,
    "ctaLink" TEXT,
    "status" "PopupCampaignStatus" NOT NULL DEFAULT 'DRAFT',
    "audience" "PopupCampaignAudience" NOT NULL DEFAULT 'ALL',
    "frequency" "PopupCampaignFrequency" NOT NULL DEFAULT 'ONCE_PER_CAMPAIGN',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PopupCampaign_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PopupCampaign_status_startsAt_endsAt_idx"
ON "PopupCampaign"("status", "startsAt", "endsAt");

CREATE INDEX "PopupCampaign_status_priority_createdAt_idx"
ON "PopupCampaign"("status", "priority", "createdAt");
