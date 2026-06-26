import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";

const OTP_TTL_MINUTES = 10;

function getOtpSecret() {
  const secret = process.env.RESET_OTP_SECRET || process.env.APP_PASSWORD;
  if (!secret) {
    throw new Error("RESET_OTP_SECRET or APP_PASSWORD must be configured.");
  }
  return createHash("sha256")
    .update(`broad-academy-password-reset:${secret}`)
    .digest();
}

export function generateOtp() {
  return randomInt(100000, 1000000).toString();
}

export function hashOtp(userId: string, otp: string) {
  return createHmac("sha256", getOtpSecret())
    .update(`${userId}:${otp}`)
    .digest("hex");
}

export function verifyOtp(userId: string, otp: string, expectedHash: string) {
  const actual = Buffer.from(hashOtp(userId, otp), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function otpExpiresAt() {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

export const OTP_EXPIRY_MINUTES = OTP_TTL_MINUTES;
