import { randomBytes } from "node:crypto";

import { getMailTransporter } from "@/lib/email";
import { db } from "@/lib/db";
import { hashValue } from "@/lib/auth/security";

const VERIFY_EXPIRY_HOURS = 48;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function createEmailVerificationToken(userId: string, email: string) {
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = hashValue(rawToken);
  const expiresAt = new Date(Date.now() + VERIFY_EXPIRY_HOURS * 60 * 60 * 1000);

  await db.emailVerificationToken.deleteMany({ where: { userId } });
  await db.emailVerificationToken.create({
    data: { userId, email, tokenHash, expiresAt },
  });

  return rawToken;
}

export async function sendVerificationEmail({
  email,
  fullName,
  token,
}: {
  email: string;
  fullName: string;
  token: string;
}) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const verifyUrl = `${siteUrl}/verify-email?token=${token}`;
  const fromUser = process.env.GMAIL;
  if (!fromUser) throw new Error("GMAIL is not configured.");

  await getMailTransporter().sendMail({
    from: `"Broad Academy" <${fromUser}>`,
    to: email,
    subject: "Verify your Broad Academy email",
    text: `Hello ${fullName}, verify your email: ${verifyUrl}`,
    html: `
      <div style="margin:0;background:#f3f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#163351">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5edf5">
          <div style="background:#163351;padding:28px 32px;color:#ffffff">
            <div style="font-size:20px;font-weight:700">Broad Academy</div>
          </div>
          <div style="padding:32px">
            <p style="margin:0 0 12px;font-size:16px">Hello ${escapeHtml(fullName)},</p>
            <h1 style="margin:0;font-size:24px">Verify your email address</h1>
            <p style="margin:14px 0 24px;color:#61758a;line-height:1.7">
              Confirm your email to secure your account and receive important enrollment updates.
            </p>
            <a href="${verifyUrl}" style="display:inline-block;padding:14px 24px;border-radius:12px;background:#007bff;color:#ffffff;font-weight:700;text-decoration:none">
              Verify email
            </a>
            <p style="margin:22px 0 0;color:#61758a;font-size:13px;line-height:1.7">
              This link expires in ${VERIFY_EXPIRY_HOURS} hours. If you did not create an account, ignore this email.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}

export async function verifyEmailToken(rawToken: string) {
  const tokenHash = hashValue(rawToken);
  const record = await db.emailVerificationToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, expiresAt: true, consumedAt: true },
  });

  if (!record || record.consumedAt || record.expiresAt < new Date()) {
    return { ok: false as const, reason: "invalid" as const };
  }

  await db.$transaction([
    db.user.update({
      where: { id: record.userId },
      data: { emailVerifiedAt: new Date() },
    }),
    db.emailVerificationToken.update({
      where: { id: record.id },
      data: { consumedAt: new Date() },
    }),
  ]);

  return { ok: true as const };
}
