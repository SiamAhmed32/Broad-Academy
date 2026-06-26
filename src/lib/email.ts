import nodemailer from "nodemailer";

import { OTP_EXPIRY_MINUTES } from "@/lib/auth/otp";

function getEmailConfig() {
  const user = process.env.GMAIL;
  const pass = process.env.APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("GMAIL and APP_PASSWORD must be configured.");
  }

  return { user, pass };
}

export function getMailTransporter() {
  const { user, pass } = getEmailConfig();
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export async function sendPasswordResetOtp({
  email,
  fullName,
  otp,
}: {
  email: string;
  fullName: string;
  otp: string;
}) {
  const { user } = getEmailConfig();
  const appName = "Broad Academy";

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: email,
    subject: `${otp} is your Broad Academy password reset code`,
    text: `Hello ${fullName}, your Broad Academy password reset code is ${otp}. It expires in ${OTP_EXPIRY_MINUTES} minutes. If you did not request this, you can ignore this email.`,
    html: `
      <div style="margin:0;background:#f3f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#163351">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5edf5">
          <div style="background:#163351;padding:28px 32px;color:#ffffff">
            <div style="font-size:20px;font-weight:700">Broad Academy</div>
            <div style="margin-top:6px;font-size:12px;letter-spacing:1.6px;color:#8cf0d0">GROW TO INFINITY</div>
          </div>
          <div style="padding:32px">
            <p style="margin:0 0 12px;font-size:16px">Hello ${escapeHtml(fullName)},</p>
            <h1 style="margin:0;font-size:26px;line-height:1.25">Reset your password</h1>
            <p style="margin:14px 0 24px;color:#61758a;line-height:1.7">
              Use this verification code to reset your Broad Academy password.
            </p>
            <div style="padding:20px;border-radius:16px;background:#f3f7fb;text-align:center;font-size:34px;font-weight:700;letter-spacing:10px;color:#007bff">
              ${otp}
            </div>
            <p style="margin:22px 0 0;color:#61758a;font-size:14px;line-height:1.7">
              This code expires in ${OTP_EXPIRY_MINUTES} minutes. Never share it with anyone.
              If you did not request a password reset, no action is needed.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
