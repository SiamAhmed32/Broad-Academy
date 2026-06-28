import { getMailTransporter } from "@/lib/email";
import { getSiteUrl, renderBroadAcademyEmail } from "@/lib/email/templates";

function sender() {
  const email = process.env.GMAIL;
  if (!email) throw new Error("GMAIL must be configured.");
  return email;
}

export async function sendStudentAccountSuspendedEmail(data: {
  studentName: string;
  studentEmail: string;
  message: string;
}) {
  const from = sender();
  const siteUrl = getSiteUrl();
  const contactUrl = `${siteUrl}/contact`;

  await getMailTransporter().sendMail({
    from: `"Broad Academy" <${from}>`,
    to: data.studentEmail,
    subject: "Your Broad Academy account has been suspended",
    text: [
      `Hello ${data.studentName},`,
      "",
      "Your Broad Academy student account has been suspended and you cannot sign in until our team approves it again.",
      "",
      "Message from our team:",
      data.message,
      "",
      `If you have questions, contact us: ${contactUrl}`,
    ].join("\n"),
    html: renderBroadAcademyEmail({
      preheader: "Your Broad Academy account has been suspended.",
      eyebrow: "ACCOUNT SUSPENDED",
      greetingName: data.studentName,
      heading: "Your account has been suspended",
      intro:
        "Your Broad Academy student account has been suspended. You will not be able to sign in, access courses, or submit documents until our team approves your account again.",
      tone: "danger",
      details: [
        { label: "Account status", value: "Suspended" },
        { label: "Message from our team", value: data.message },
      ],
      cta: { label: "Contact support", href: contactUrl },
      note: "If you believe this was a mistake, reply to this email or use the contact page and our team will review your account.",
    }),
  });
}

export async function sendStudentAccountReactivatedEmail(data: {
  studentName: string;
  studentEmail: string;
}) {
  const from = sender();
  const siteUrl = getSiteUrl();
  const dashboardUrl = `${siteUrl}/dashboard`;

  await getMailTransporter().sendMail({
    from: `"Broad Academy" <${from}>`,
    to: data.studentEmail,
    subject: "Your Broad Academy account is active again",
    text: [
      `Hello ${data.studentName},`,
      "",
      "Good news — your Broad Academy account has been approved again. You can sign in and continue learning.",
      "",
      `Open your dashboard: ${dashboardUrl}`,
    ].join("\n"),
    html: renderBroadAcademyEmail({
      preheader: "Your Broad Academy account is active again.",
      eyebrow: "ACCOUNT APPROVED",
      greetingName: data.studentName,
      heading: "Your account is active again",
      intro:
        "Your Broad Academy student account has been approved again. You can sign in, access your courses, and use all student features.",
      tone: "success",
      details: [{ label: "Account status", value: "Active" }],
      cta: { label: "Open student dashboard", href: dashboardUrl },
    }),
  });
}
