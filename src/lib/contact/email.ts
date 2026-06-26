import { getMailTransporter } from "@/lib/email";
import {
  contactRoleLabels,
  contactSubjectLabels,
  type ContactInput,
} from "@/lib/contact/validation";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSenderEmail() {
  const user = process.env.GMAIL;
  if (!user) throw new Error("GMAIL must be configured.");
  return user;
}

function getAdminRecipient() {
  return process.env.CONTACT_ADMIN_EMAIL || process.env.GMAIL || "";
}

export async function sendContactNotification(
  data: ContactInput & { messageId: string },
) {
  const adminEmail = getAdminRecipient();
  if (!adminEmail) {
    throw new Error("CONTACT_ADMIN_EMAIL or GMAIL must be configured.");
  }

  const user = getSenderEmail();

  const appName = "Broad Academy";
  const roleLabel = contactRoleLabels[data.role];
  const subjectLabel = contactSubjectLabels[data.subject];
  const phoneLine = data.phone ? `Phone: ${data.phone}` : "Phone: Not provided";

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: adminEmail,
    replyTo: data.email,
    subject: `[Contact] ${subjectLabel} — ${data.fullName}`,
    text: [
      `New contact message (${data.source})`,
      `ID: ${data.messageId}`,
      "",
      `Name: ${data.fullName}`,
      `Email: ${data.email}`,
      phoneLine,
      `Role: ${roleLabel}`,
      `Subject: ${subjectLabel}`,
      "",
      data.message,
    ].join("\n"),
    html: `
      <div style="margin:0;background:#f3f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#163351">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5edf5">
          <div style="background:#163351;padding:28px 32px;color:#ffffff">
            <div style="font-size:20px;font-weight:700">${appName}</div>
            <div style="margin-top:6px;font-size:12px;letter-spacing:1.6px;color:#8cf0d0">NEW CONTACT MESSAGE</div>
          </div>
          <div style="padding:32px">
            <p style="margin:0 0 8px;font-size:13px;color:#61758a">Source: ${escapeHtml(data.source)} · ID: ${escapeHtml(data.messageId)}</p>
            <h1 style="margin:0;font-size:24px;line-height:1.3">${escapeHtml(subjectLabel)}</h1>
            <table style="margin:20px 0 0;width:100%;border-collapse:collapse;font-size:14px">
              <tr><td style="padding:8px 0;color:#61758a;width:110px">Name</td><td style="padding:8px 0;font-weight:600">${escapeHtml(data.fullName)}</td></tr>
              <tr><td style="padding:8px 0;color:#61758a">Email</td><td style="padding:8px 0"><a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></td></tr>
              <tr><td style="padding:8px 0;color:#61758a">Phone</td><td style="padding:8px 0">${escapeHtml(data.phone || "Not provided")}</td></tr>
              <tr><td style="padding:8px 0;color:#61758a">Role</td><td style="padding:8px 0">${escapeHtml(roleLabel)}</td></tr>
            </table>
            <div style="margin-top:24px;padding:20px;border-radius:16px;background:#f8fbff;border:1px solid #e5edf5;line-height:1.7;white-space:pre-wrap">${escapeHtml(data.message)}</div>
          </div>
        </div>
      </div>
    `,
  });
}

export async function sendContactConfirmation(
  data: Pick<ContactInput, "email" | "fullName" | "subject">,
) {
  const user = getSenderEmail();

  const appName = "Broad Academy";
  const subjectLabel = contactSubjectLabels[data.subject];

  await getMailTransporter().sendMail({
    from: `"${appName}" <${user}>`,
    to: data.email,
    subject: `We received your message — ${appName}`,
    text: `Hello ${data.fullName}, thank you for contacting ${appName} about "${subjectLabel}". Our team will get back to you within 1–2 business days.`,
    html: `
      <div style="margin:0;background:#f3f7fb;padding:32px 16px;font-family:Arial,sans-serif;color:#163351">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5edf5">
          <div style="background:#163351;padding:28px 32px;color:#ffffff">
            <div style="font-size:20px;font-weight:700">${appName}</div>
          </div>
          <div style="padding:32px">
            <p style="margin:0 0 12px;font-size:16px">Hello ${escapeHtml(data.fullName)},</p>
            <h1 style="margin:0;font-size:24px;line-height:1.3">We received your message</h1>
            <p style="margin:14px 0 0;color:#61758a;line-height:1.7">
              Thank you for reaching out about <strong>${escapeHtml(subjectLabel)}</strong>.
              Our academic support team will review your message and respond within 1–2 business days.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}
