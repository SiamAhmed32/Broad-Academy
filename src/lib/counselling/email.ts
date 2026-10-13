import { formatSessionDateTime } from "@/lib/counselling/schedule";
import { getMailTransporter } from "@/lib/email";
import { absoluteUrl } from "@/lib/site/url";

interface BookingEmailData {
  fullName: string;
  email: string;
  phone: string;
  educationLevel: string;
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

/** "Sat, 12 Oct 2026, 7:00 pm" (Bangladesh time) or a not-yet-scheduled note. */
function sessionTimeText(scheduledAt: Date | null | undefined) {
  return formatSessionDateTime(scheduledAt) ?? "to be scheduled";
}

function emailShell(heading: string, bodyHtml: string) {
  const appName = "Broad Academy";
  return `
    <div style="margin:0;background:#f3f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#163351">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5edf5">
        <div style="background:#163351;padding:28px 32px;color:#ffffff">
          <div style="font-size:20px;font-weight:700">${appName}</div>
          <div style="margin-top:6px;font-size:12px;letter-spacing:1.6px;color:#8cf0d0">BEYOND INFINITY</div>
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

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: data.email,
    subject: `Your Counselling Request Was Received — ${appName}`,
    text: `Hello ${data.fullName}, your Study Plan / Counselling request has been received. We will contact you soon to confirm the session.`,
    html: emailShell(
      "Your request was received",
      `
        <p style="margin:0 0 12px;font-size:16px">Hello ${escapeHtml(data.fullName)},</p>
        <p style="margin:0 0 24px;color:#61758a;line-height:1.7">
          Thank you for your counselling request. Our team will contact you to confirm your session and share the session fee before the meeting.
        </p>
        <div style="padding:20px;border-radius:16px;background:#f3f7fb">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#61758a;width:140px">Class</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.educationLevel)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Phone</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.phone)}</td></tr>
          </table>
        </div>
      `,
    ),
  });

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: user,
    subject: `New Counselling Booking — ${escapeHtml(data.fullName)}`,
    text: `New booking from ${data.fullName} (${data.email}, ${data.phone}) for ${data.educationLevel}.`,
    html: emailShell(
      "New Counselling Booking",
      `
        <div style="padding:20px;border-radius:16px;background:#f3f7fb">
          <table style="width:100%;border-collapse:collapse;font-size:14px">
            <tr><td style="padding:8px 0;color:#61758a;width:140px">Name</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.fullName)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Email</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.email)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Phone</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.phone)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Class</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.educationLevel)}</td></tr>
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
  scheduledAt,
  meetingLink,
}: {
  email: string;
  fullName: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
  scheduledAt: Date | null;
  meetingLink?: string | null;
}) {
  const { user } = getEmailConfig();
  const appName = "Broad Academy";
  const sessionTime = formatSessionDateTime(scheduledAt);
  const portalUrl = absoluteUrl("/dashboard?tab=counselling");

  let subject = "";
  let heading = "";
  let bodyText = "";
  let actionHtml = "";

  if (status === "CONFIRMED") {
    subject = `Your Study Plan / Counselling session is confirmed — ${appName}`;
    heading = "Session confirmed";
    bodyText = sessionTime
      ? `Hello ${escapeHtml(fullName)}, your Study Plan / Counselling session is confirmed for <strong>${sessionTime}</strong> (Bangladesh time). You can now share documents for your counsellor from your dashboard.`
      : `Hello ${escapeHtml(fullName)}, your Study Plan / Counselling session is confirmed. Our team will share the session time soon. You can now share documents for your counsellor from your dashboard.`;
    actionHtml = `
      <div style="margin-top:24px;text-align:center">
        <a href="${meetingLink ? escapeHtml(meetingLink) : portalUrl}" target="_blank" style="background:#007bff;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">${meetingLink ? "Join online session" : "Open your dashboard"}</a>
      </div>
    `;
  } else if (status === "COMPLETED") {
    subject = `Your Study Plan / Counselling session is complete — ${appName}`;
    heading = "Session completed";
    bodyText = `Hello ${escapeHtml(fullName)}, your Study Plan / Counselling session is complete. Any notes and files from your counsellor are in your dashboard.`;
    actionHtml = `
      <div style="margin-top:24px;text-align:center">
        <a href="${portalUrl}" target="_blank" style="background:#007bff;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">View notes and files</a>
      </div>
    `;
  } else {
    subject = `Your Study Plan / Counselling session was cancelled — ${appName}`;
    heading = "Session cancelled";
    bodyText = sessionTime
      ? `Hello ${escapeHtml(fullName)}, your Study Plan / Counselling session scheduled for <strong>${sessionTime}</strong> has been cancelled. Please contact us if you have any questions.`
      : `Hello ${escapeHtml(fullName)}, your Study Plan / Counselling request has been cancelled. Please contact us if you have any questions.`;
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
}: {
  email: string;
  fullName: string;
  sessionFee: number;
}) {
  const { user } = getEmailConfig();
  const appName = "Broad Academy";
  const portalUrl = absoluteUrl("/dashboard?tab=counselling");
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
          Hello ${escapeHtml(fullName)}, the fee for your Study Plan / Counselling session is <strong>৳${sessionFee.toLocaleString("en-US")}</strong>. Please pay with bKash and submit the payment proof in your dashboard.
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
  sessionConfirmed,
}: {
  email: string;
  fullName: string;
  sessionFee: number | null;
  /** The session was confirmed in the same step (a separate email says so). */
  sessionConfirmed: boolean;
}) {
  const { user } = getEmailConfig();
  const appName = "Broad Academy";
  const nextStep = sessionConfirmed ? "" : " We will confirm your session shortly.";

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: email,
    subject: `Counselling payment verified — ${appName}`,
    text: `Hello ${fullName}, your counselling payment${sessionFee ? ` of ৳${sessionFee}` : ""} has been verified.${nextStep}`,
    html: emailShell(
      "Payment verified",
      `
        <p style="margin:0;font-size:16px;line-height:1.6;color:#61758a">
          Hello ${escapeHtml(fullName)}, your payment${sessionFee ? ` of <strong>৳${sessionFee.toLocaleString("en-US")}</strong>` : ""} for the Study Plan / Counselling session has been verified.${nextStep}
        </p>
      `,
    ),
  });
}

export async function sendCounsellingPaymentSubmittedEmails({
  fullName,
  email,
  sessionFee,
  scheduledAt,
  bkashTransactionId,
}: {
  fullName: string;
  email: string;
  sessionFee: number | null;
  scheduledAt: Date | null;
  bkashTransactionId: string;
}) {
  const { user } = getEmailConfig();
  const appName = "Broad Academy";
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
            <tr><td style="padding:8px 0;color:#61758a">Session</td><td style="padding:8px 0;font-weight:600">${sessionTimeText(scheduledAt)}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Amount</td><td style="padding:8px 0;font-weight:600">${amount}</td></tr>
            <tr><td style="padding:8px 0;color:#61758a">Transaction ID</td><td style="padding:8px 0;font-weight:600">${escapeHtml(bkashTransactionId)}</td></tr>
          </table>
        </div>
      `,
    ),
  });
}

export async function sendCounsellingScheduleEmail({
  email,
  fullName,
  scheduledAt,
  meetingLink,
  rescheduled,
}: {
  email: string;
  fullName: string;
  scheduledAt: Date;
  meetingLink?: string | null;
  rescheduled: boolean;
}) {
  const { user } = getEmailConfig();
  const appName = "Broad Academy";
  const sessionTime = sessionTimeText(scheduledAt);
  const portalUrl = absoluteUrl("/dashboard?tab=counselling");
  const heading = rescheduled ? "Session time changed" : "Session scheduled";

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: email,
    subject: `${heading}: ${sessionTime} — ${appName}`,
    text: `Hello ${fullName}, your Study Plan / Counselling session is ${rescheduled ? "now " : ""}scheduled for ${sessionTime} (Bangladesh time).`,
    html: emailShell(
      heading,
      `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#61758a">
          Hello ${escapeHtml(fullName)}, your Study Plan / Counselling session is ${rescheduled ? "now " : ""}scheduled for <strong>${sessionTime}</strong> (Bangladesh time).
        </p>
        <div style="margin-top:24px;text-align:center">
          <a href="${meetingLink ? escapeHtml(meetingLink) : portalUrl}" target="_blank" style="background:#007bff;color:#ffffff;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:bold;display:inline-block">${meetingLink ? "Join online session" : "Open your dashboard"}</a>
        </div>
      `,
    ),
  });
}
