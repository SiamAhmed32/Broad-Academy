import { getMailTransporter } from "@/lib/email";

interface BookingEmailData {
  fullName: string;
  email: string;
  phone: string;
  educationLevel: string;
  subjectInterest: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getEmailConfig() {
  const user = process.env.GMAIL;
  const pass = process.env.APP_PASSWORD;

  if (!user || !pass) {
    throw new Error("GMAIL and APP_PASSWORD must be configured.");
  }

  return { user, pass };
}

function formatSessionDate(value: Date | string) {
  return new Date(value).toLocaleDateString("en-GB", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function emailShell(heading: string, bodyHtml: string) {
  const appName = "Broad Academy";
  return `
    <div style="margin:0;background:#f3f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#163351">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5edf5">
        <div style="background:#163351;padding:28px 32px;color:#ffffff">
          <div style="font-size:20px;font-weight:700">${appName}</div>
          <div style="margin-top:6px;font-size:12px;letter-spacing:1.6px;color:#8cf0d0">GROW TO INFINITY</div>
        </div>
        <div style="padding:32px">
          <h1 style="margin:0 0 16px;font-size:24px;line-height:1.25;color:#163351">${heading}</h1>
          ${bodyHtml}
          <hr style="margin:24px 0;border:none;border-top:1px solid #e5edf5" />
          <p style="margin:0;color:#61758a;font-size:13px;line-height:1.6">
            If you have any questions, feel free to reply to this email or visit our website.
          </p>
        </div>
      </div>
    </div>
  `;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const { user } = getEmailConfig();
  const appName = "Broad Academy";
  const formattedDate = formatSessionDate(data.preferredDate);

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: data.email,
    subject: `Your Counselling Session is Booked — ${appName}`,
    text: `Hello ${data.fullName}, your counselling session has been booked for ${formattedDate} at ${data.preferredTime}. We will contact you soon to confirm.`,
    html: emailShell(
      "Your Session is Booked! ✨",
      `
        <p style="margin:0 0 12px;font-size:16px">Hello ${escapeHtml(data.fullName)},</p>
        <p style="margin:0 0 24px;color:#61758a;line-height:1.7">
          Thank you for your counselling request. Our team will contact you to confirm your session and share the session fee before the meeting.
        </p>
        <div style="padding:20px;border-radius:16px;background:#f3f7fb">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#61758a;width:140px">Date</td><td style="padding:8px 0;font-weight:600">${formattedDate}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Time</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.preferredTime)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Education Level</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.educationLevel)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Subject</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.subjectInterest)}</td></tr>
          </table>
        </div>
      `,
    ),
  });

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: user,
    subject: `New Counselling Booking — ${escapeHtml(data.fullName)}`,
    text: `New booking from ${data.fullName} (${data.email}, ${data.phone}) for ${formattedDate} at ${data.preferredTime}.`,
    html: emailShell(
      "📋 New Counselling Booking",
      `
        <div style="padding:20px;border-radius:16px;background:#f3f7fb">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#61758a;width:140px">Name</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.fullName)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Email</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.email)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Phone</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.phone)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Date</td><td style="padding:8px 0;font-weight:600">${formattedDate}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Time</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.preferredTime)}</td></tr>
          </table>
        </div>
      `,
    ),
  });
}

export async function sendBookingStatusUpdateEmail({
  email,
  fullName,
  status,
  preferredDate,
  preferredTime,
  meetingLink,
}: {
  email: string;
  fullName: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
  preferredDate: Date;
  preferredTime: string;
  meetingLink?: string | null;
}) {
  const { user } = getEmailConfig();
  const appName = "Broad Academy";
  const formattedDate = formatSessionDate(preferredDate);

  let subject = "";
  let heading = "";
  let bodyText = "";
  let actionHtml = "";

  if (status === "CONFIRMED") {
    subject = `Your Counselling Session is Confirmed! — ${appName}`;
    heading = "Session Confirmed";
    bodyText = `Hello ${fullName}, we are pleased to inform you that your counselling session has been confirmed for <strong>${formattedDate}</strong> at <strong>${preferredTime}</strong>.`;
    if (meetingLink) {
      actionHtml = `
        <div style="margin-top:24px;text-align:center">
          <a href="${meetingLink}" target="_blank" style="background:#007bff;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">Join Online Session</a>
        </div>
      `;
    }
  } else if (status === "COMPLETED") {
    subject = `Your Counselling Session Summary is Ready — ${appName}`;
    heading = "Session Completed";
    bodyText = `Hello ${fullName}, your counselling session on ${formattedDate} is completed. Your academic advisor has uploaded post-session notes and files.`;
    actionHtml = `
      <div style="margin-top:24px;text-align:center">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?tab=counselling" target="_blank" style="background:#059669;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">View Session Summary</a>
      </div>
    `;
  } else {
    subject = `Your Counselling Session was Cancelled — ${appName}`;
    heading = "Session Cancelled";
    bodyText = `Hello ${fullName}, we regret to inform you that your counselling session scheduled for <strong>${formattedDate}</strong> at <strong>${preferredTime}</strong> has been cancelled.`;
  }

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: email,
    subject,
    text: bodyText.replace(/<[^>]*>/g, ""),
    html: emailShell(
      heading,
      `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#61758a">${bodyText}</p>${actionHtml}`,
    ),
  });
}

export async function sendCounsellingFeeQuotedEmail({
  email,
  fullName,
  sessionFee,
  preferredDate,
  preferredTime,
}: {
  email: string;
  fullName: string;
  sessionFee: number;
  preferredDate: Date;
  preferredTime: string;
}) {
  const { user } = getEmailConfig();
  const appName = "Broad Academy";
  const formattedDate = formatSessionDate(preferredDate);
  const portalUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/dashboard?tab=counselling`;
  const bkashNumber = process.env.BKASH_PAYMENT_NUMBER?.trim() || "Contact support";

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: email,
    subject: `Counselling session fee — ${appName}`,
    text: `Hello ${fullName}, your counselling session fee is ৳${sessionFee}. Send payment to ${bkashNumber} and submit proof in your portal.`,
    html: emailShell(
      "Session fee quoted",
      `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#61758a">
          Hello ${escapeHtml(fullName)}, your counselling session on <strong>${formattedDate}</strong> at <strong>${escapeHtml(preferredTime)}</strong> has a fee of <strong>৳${sessionFee.toLocaleString("en-US")}</strong>.
        </p>
        <div style="padding:20px;border-radius:16px;background:#fff5fa;border:1px solid #e2136e22">
          <p style="margin:0 0 8px;font-size:14px;color:#61758a">Send money to</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:#163351">${escapeHtml(bkashNumber)}</p>
        </div>
        <div style="margin-top:24px;text-align:center">
          <a href="${portalUrl}" target="_blank" style="background:#163351;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">Submit payment proof</a>
        </div>
      `,
    ),
  });
}

export async function sendCounsellingPaymentVerifiedEmail({
  email,
  fullName,
  sessionFee,
  preferredDate,
  preferredTime,
}: {
  email: string;
  fullName: string;
  sessionFee: number | null;
  preferredDate: Date;
  preferredTime: string;
}) {
  const { user } = getEmailConfig();
  const appName = "Broad Academy";
  const formattedDate = formatSessionDate(preferredDate);

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: email,
    subject: `Counselling payment verified — ${appName}`,
    text: `Hello ${fullName}, your counselling payment${sessionFee ? ` of ৳${sessionFee}` : ""} has been verified.`,
    html: emailShell(
      "Payment verified",
      `
        <p style="margin:0;font-size:16px;line-height:1.6;color:#61758a">
          Hello ${escapeHtml(fullName)}, your payment for the counselling session on <strong>${formattedDate}</strong> at <strong>${escapeHtml(preferredTime)}</strong> has been verified. We will confirm your session shortly.
        </p>
      `,
    ),
  });
}

export async function sendCounsellingPaymentSubmittedEmails({
  fullName,
  email,
  sessionFee,
  preferredDate,
  preferredTime,
  bkashTransactionId,
}: {
  fullName: string;
  email: string;
  sessionFee: number | null;
  preferredDate: Date;
  preferredTime: string;
  bkashTransactionId: string;
}) {
  const { user } = getEmailConfig();
  const appName = "Broad Academy";
  const formattedDate = formatSessionDate(preferredDate);
  const amount = sessionFee ? `৳${sessionFee.toLocaleString("en-US")}` : "N/A";

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: user,
    subject: `Counselling payment proof — ${fullName}`,
    text: `${fullName} submitted counselling payment proof. Amount: ${amount}. Transaction ID: ${bkashTransactionId}.`,
    html: emailShell(
      "Counselling payment proof submitted",
      `
        <div style="padding:20px;border-radius:16px;background:#f3f7fb">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#61758a;width:140px">Student</td><td style="padding:8px 0;font-weight:600">${escapeHtml(fullName)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Email</td><td style="padding:8px 0;font-weight:600">${escapeHtml(email)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Session</td><td style="padding:8px 0;font-weight:600">${formattedDate} · ${escapeHtml(preferredTime)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Amount</td><td style="padding:8px 0;font-weight:600">${amount}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Transaction ID</td><td style="padding:8px 0;font-weight:600">${escapeHtml(bkashTransactionId)}</td></tr>
          </table>
        </div>
      `,
    ),
  });
}
