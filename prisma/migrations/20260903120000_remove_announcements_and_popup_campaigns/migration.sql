-- Remove the Announcements feature and the Offers & Popup Campaigns feature.

DROP TABLE IF EXISTS "PopupCampaign";
DROP TABLE IF EXISTS "Announcement";

DROP TYPE IF EXISTS "PopupCampaignFrequency";
DROP TYPE IF EXISTS "PopupCampaignAudience";
DROP TYPE IF EXISTS "PopupCampaignStatus";
