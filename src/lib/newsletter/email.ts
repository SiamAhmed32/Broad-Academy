import { getMailTransporter } from "@/lib/email";
import { getSiteUrl, renderBroadAcademyEmail } from "@/lib/email/templates";
import { buildUnsubscribeToken } from "@/lib/newsletter/unsubscribe";

function sender() {
  const email = process.env.GMAIL;
  if (!email) throw new Error("GMAIL must be configured.");
  return email;
}

export async function sendNewsletterWelcomeEmail(input: {
  subscriberId: string;
  email: string;
  source: string;
}) {
  const from = sender();
  const siteUrl = getSiteUrl();
  const token = buildUnsubscribeToken(input.subscriberId, input.email);
  const unsubscribeUrl = `${siteUrl}/newsletter/unsubscribe?email=${encodeURIComponent(input.email)}&token=${encodeURIComponent(token)}`;

  await getMailTransporter().sendMail({
    from: `"Broad Academy" <${from}>`,
    to: input.email,
    subject: "Welcome to Broad Academy updates",
    text: [
      "Welcome to Broad Academy!",
      "",
      "You are now subscribed to receive course launches, offers, and important updates.",
      "",
      `Manage subscription: ${unsubscribeUrl}`,
    ].join("\n"),
    html: renderBroadAcademyEmail({
      preheader: "You are subscribed to Broad Academy updates.",
      eyebrow: "NEWSLETTER",
      greetingName: "there",
      heading: "You are subscribed",
      intro:
        "Thanks for joining the Broad Academy newsletter. You will receive useful updates like new courses, campaign offers, and important academy announcements.",
      tone: "success",
      details: [
        { label: "Email", value: input.email },
        { label: "Source", value: input.source },
        { label: "Status", value: "Active subscription" },
      ],
      cta: { label: "Explore courses", href: `${siteUrl}/courses` },
      secondaryCta: { label: "Unsubscribe anytime", href: unsubscribeUrl },
      note: "If you did not subscribe, use the unsubscribe link immediately.",
    }),
  });
}

export async function sendOfferCampaignEmails(input: {
  subscribers: Array<{ id: string; email: string }>;
  title: string;
  content: string;
  link: string;
}) {
  if (input.subscribers.length === 0) return 0;

  const from = sender();
  const siteUrl = getSiteUrl();
  const path = input.link.startsWith("/") ? input.link : `/${input.link}`;
  const targetUrl = `${siteUrl}${path}`;
  const transporter = getMailTransporter();

  await Promise.allSettled(
    input.subscribers.map((subscriber) => {
      const token = buildUnsubscribeToken(subscriber.id, subscriber.email);
      const unsubscribeUrl = `${siteUrl}/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${encodeURIComponent(token)}`;

      return transporter.sendMail({
        from: `"Broad Academy" <${from}>`,
        to: subscriber.email,
        subject: input.title,
        text: [
          input.title,
          "",
          input.content,
          "",
          `View details: ${targetUrl}`,
          "",
          `Unsubscribe: ${unsubscribeUrl}`,
        ].join("\n"),
        html: renderBroadAcademyEmail({
          preheader: input.title,
          eyebrow: "NEW CAMPAIGN",
          greetingName: "there",
          heading: input.title,
          intro: input.content,
          cta: { label: "View details", href: targetUrl },
          secondaryCta: { label: "Unsubscribe", href: unsubscribeUrl },
          note: "You are receiving this because you subscribed to Broad Academy updates.",
        }),
      });
    }),
  );

  return input.subscribers.length;
}
