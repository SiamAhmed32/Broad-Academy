import { getMailTransporter } from "@/lib/email";
import { getSiteUrl, renderBroadAcademyEmail, escapeHtml } from "@/lib/email/templates";

function sender() {
  const email = process.env.GMAIL;
  if (!email) throw new Error("GMAIL must be configured.");
  return email;
}

export async function sendEnrollmentSubmittedEmails(data: {
  requestId: string;
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  courseSlug: string;
  transactionId: string;
  paidAmount: number;
  studentPhone: string;
  guardianPhone: string;
  bkashSenderNumber: string;
}) {
  const from = sender();
  const admin = process.env.ENROLLMENT_ADMIN_EMAIL || from;
  const transporter = getMailTransporter();
  const siteUrl = getSiteUrl();
  const reviewUrl = `${siteUrl}/admin/students?tab=requests&request=${encodeURIComponent(data.requestId)}`;
  const courseUrl = `${siteUrl}/courses/${encodeURIComponent(data.courseSlug)}`;

  await Promise.all([
    transporter.sendMail({
      from: `"Broad Academy" <${from}>`,
      to: data.studentEmail,
      subject: `Payment proof received — ${data.courseTitle}`,
      text: [
        `Hello ${data.studentName},`,
        "",
        `We received your bKash payment proof for ${data.courseTitle}.`,
        `Transaction ID: ${data.transactionId}`,
        "",
        "What happens next:",
        "1. Our team reviews your screenshot",
        "2. You receive an email when access is approved",
        "3. The course appears in your student dashboard",
        "",
        `Track your course page: ${courseUrl}`,
      ].join("\n"),
      html: renderBroadAcademyEmail({
        preheader: `Your payment proof for ${data.courseTitle} is in the verification queue.`,
        eyebrow: "ENROLLMENT RECEIVED",
        greetingName: data.studentName,
        heading: "Your payment proof is under review",
        intro: `Thank you for submitting your bKash payment for <strong>${escapeHtml(data.courseTitle)}</strong>. Our academic support team will verify the transaction and activate your course access.`,
        tone: "warning",
        details: [
          { label: "Course", value: data.courseTitle },
          { label: "Amount paid", value: `৳${data.paidAmount.toLocaleString("en-US")}` },
          { label: "Transaction ID", value: data.transactionId, mono: true },
          { label: "Status", value: "Pending verification" },
        ],
        steps: [
          "Our team reviews your payment screenshot",
          "You receive an email once access is approved or if we need corrections",
          "Approved courses appear in your student dashboard",
        ],
        cta: { label: "View course page", href: courseUrl },
        note: "Course access is not automatic. Verification usually takes 1–2 business days during office hours.",
      }),
    }),
    transporter.sendMail({
      from: `"Broad Academy" <${from}>`,
      to: admin,
      subject: `[Action required] Verify enrollment — ${data.studentName}`,
      text: [
        "New bKash enrollment request",
        "",
        `Student: ${data.studentName} (${data.studentEmail})`,
        `Course: ${data.courseTitle}`,
        `Transaction ID: ${data.transactionId}`,
        `Amount: ৳${data.paidAmount.toLocaleString("en-US")}`,
        `Student phone: ${data.studentPhone}`,
        `Guardian phone: ${data.guardianPhone}`,
        `bKash sender: ${data.bkashSenderNumber}`,
        "",
        `Review and approve: ${reviewUrl}`,
      ].join("\n"),
      html: renderBroadAcademyEmail({
        preheader: `${data.studentName} submitted payment proof for ${data.courseTitle}.`,
        eyebrow: "ADMIN ACTION REQUIRED",
        greetingName: "Team",
        heading: "New payment proof to verify",
        intro: `<strong>${escapeHtml(data.studentName)}</strong> submitted a bKash payment for <strong>${escapeHtml(data.courseTitle)}</strong>. Review the screenshot and approve or reject access from the admin panel.`,
        tone: "default",
        details: [
          { label: "Student", value: `${data.studentName} (${data.studentEmail})` },
          { label: "Course", value: data.courseTitle },
          { label: "Transaction ID", value: data.transactionId, mono: true },
          { label: "Amount", value: `৳${data.paidAmount.toLocaleString("en-US")}` },
          { label: "Student phone", value: data.studentPhone },
          { label: "Guardian phone", value: data.guardianPhone },
          { label: "bKash sender", value: data.bkashSenderNumber },
          { label: "Request ID", value: data.requestId, mono: true },
        ],
        cta: { label: "Review & give access", href: reviewUrl },
        secondaryCta: {
          label: "Open payment verification queue",
          href: `${siteUrl}/admin/students?tab=requests`,
        },
        note: "Use Approve & activate after confirming the screenshot, amount, and transaction ID.",
      }),
    }),
  ]);
}

export async function sendEnrollmentDecisionEmail(data: {
  studentName: string;
  studentEmail: string;
  courseTitle: string;
  courseSlug: string;
  approved: boolean;
  reviewNote: string | null;
}) {
  const from = sender();
  const siteUrl = getSiteUrl();
  const dashboardUrl = `${siteUrl}/dashboard`;
  const learnUrl = `${siteUrl}/learn/${encodeURIComponent(data.courseSlug)}`;
  const courseUrl = `${siteUrl}/courses/${encodeURIComponent(data.courseSlug)}`;

  const heading = data.approved
    ? "Your course access is now active"
    : "Your enrollment needs a correction";

  const intro = data.approved
    ? `Great news — your payment for <strong>${escapeHtml(data.courseTitle)}</strong> has been verified. You can start learning right away from your student dashboard.`
    : `We reviewed your payment proof for <strong>${escapeHtml(data.courseTitle)}</strong>, but we could not approve it yet.${
        data.reviewNote
          ? ` Reason: <strong>${escapeHtml(data.reviewNote)}</strong>.`
          : ""
      } You can submit corrected proof from the course page.`;

  await getMailTransporter().sendMail({
    from: `"Broad Academy" <${from}>`,
    to: data.studentEmail,
    subject: `${heading} — ${data.courseTitle}`,
    text: [
      `Hello ${data.studentName},`,
      "",
      heading,
      "",
      data.approved
        ? `Start learning: ${learnUrl}`
        : `Resubmit from: ${courseUrl}`,
      data.reviewNote ? `Note: ${data.reviewNote}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
    html: renderBroadAcademyEmail({
      preheader: heading,
      eyebrow: data.approved ? "ACCESS APPROVED" : "ACTION NEEDED",
      greetingName: data.studentName,
      heading,
      intro,
      tone: data.approved ? "success" : "danger",
      details: [
        { label: "Course", value: data.courseTitle },
        {
          label: "Status",
          value: data.approved ? "Access active" : "Needs resubmission",
        },
        ...(data.reviewNote
          ? [{ label: "Team note", value: data.reviewNote }]
          : []),
      ],
      cta: data.approved
        ? { label: "Start learning now", href: learnUrl }
        : { label: "Resubmit payment proof", href: courseUrl },
      secondaryCta: { label: "Open student dashboard", href: dashboardUrl },
      note: data.approved
        ? "Your progress will sync automatically as you complete lessons."
        : "Double-check the bKash amount, transaction ID, and screenshot before submitting again.",
    }),
  });
}
