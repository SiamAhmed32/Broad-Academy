-- Counselling payment tracking
DO $$ BEGIN
  CREATE TYPE "CounsellingPaymentStatus" AS ENUM ('UNQUOTED', 'AWAITING_PAYMENT', 'PROOF_SUBMITTED', 'PAID', 'WAIVED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "sessionFee" INTEGER;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "feeQuotedAt" TIMESTAMP(3);
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paymentStatus" "CounsellingPaymentStatus" NOT NULL DEFAULT 'UNQUOTED';
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "bkashSenderNumber" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "bkashTransactionId" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paymentProofUrl" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paymentProofPublicId" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paymentProofFormat" TEXT;
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paymentSubmittedAt" TIMESTAMP(3);
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paidAt" TIMESTAMP(3);
ALTER TABLE "CounsellingBooking" ADD COLUMN IF NOT EXISTS "paymentNote" TEXT;
CREATE INDEX IF NOT EXISTS "CounsellingBooking_paymentStatus_idx" ON "CounsellingBooking"("paymentStatus");
