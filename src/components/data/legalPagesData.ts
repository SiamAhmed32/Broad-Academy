export type LegalPageSlug =
  | "terms-and-conditions"
  | "privacy-policy"
  | "refund-policy";

export type LegalSection = {
  title: string;
  body: string;
};

export type LegalPageData = {
  title: string;
  intro: string;
  sections: LegalSection[];
  lastUpdated: string;
};

export const SUPPORT_EMAIL = "support.broadacademy@gmail.com";

export const legalPagesData: Record<LegalPageSlug, LegalPageData> = {
  "terms-and-conditions": {
    title: "Terms and Conditions",
    intro:
      "Welcome to Broad Academy. By using our website, courses, and services, you agree to follow the terms below. Please read them carefully.",
    lastUpdated: "October 9, 2026",
    sections: [
      {
        title: "Course Access and Usage",
        body: "After joining a course, you will get access to live classes, recorded classes, notes, and other learning materials. These materials are only for your personal use. You cannot share, copy, or distribute them without our permission.",
      },
      {
        title: "Refund Policy",
        body: "Course fees are generally not refundable after enrollment or payment. Please check the course details and available sample materials before making your purchase.",
      },
      {
        title: "Ownership of Content",
        body: "All videos, notes, slides, and other course materials belong to Broad Academy. Copying, recording, selling, or sharing any course content without permission is not allowed and may lead to legal action.",
      },
      {
        title: "User Conduct",
        body: "Everyone is expected to behave respectfully during classes and community activities. Any abusive, offensive, or inappropriate behavior may lead to temporary suspension or permanent removal from the platform.",
      },
      {
        title: "Changes to Terms",
        body: "Broad Academy may change or update these Terms and Conditions when needed. Any changes will be published on our website and will apply from the date they are posted.",
      },
    ],
  },
  "privacy-policy": {
    title: "Privacy Policy",
    intro:
      "Broad Academy respects your privacy and takes care of your personal information. This Privacy Policy explains what information we collect, how we use it, and how we keep it safe.",
    lastUpdated: "October 9, 2026",
    sections: [
      {
        title: "Information We Collect",
        body: "When you register, use our services, or contact us, we may collect information such as your name, email address, phone number, and payment information.",
      },
      {
        title: "How We Use Your Information",
        body: "We use your information to provide our services, complete payments, send important updates, respond to your requests, and make your learning experience better.",
      },
      {
        title: "Data Protection",
        body: "We take reasonable steps to keep your personal information safe and prevent unauthorized access, changes, or sharing.",
      },
      {
        title: "Third-Party Services",
        body: "We may use trusted third-party services for payments, website analytics, email, and other necessary services. These services are expected to keep your information safe and follow applicable privacy rules.",
      },
      {
        title: "Cookies",
        body: "Our website may use cookies to improve your browsing experience and understand how visitors use our website. You can manage or turn off cookies from your browser settings.",
      },
      {
        title: "Your Rights",
        body: "You may ask to see, update, or delete your personal information where applicable. If you have any questions or concerns about your privacy, please contact us.",
      },
      {
        title: "Updates to this Policy",
        body: "Broad Academy may update this Privacy Policy when necessary. Any changes will be published on this page along with the updated date.",
      },
    ],
  },
  "refund-policy": {
    title: "Refund Policy",
    intro:
      "At Broad Academy, we want to give you a good learning experience through our live and recorded courses. Please read our refund policy before buying a course.",
    lastUpdated: "October 9, 2026",
    sections: [
      {
        title: "No Refund Policy",
        body: "After you pay for a course, the payment cannot usually be refunded. We do not provide refunds because of course content, technical problems, or personal reasons.",
      },
      {
        title: "Course Previews and Descriptions",
        body: "Before buying a course, you can check the course details, sample classes, and teacher information. Please review these before making your payment.",
      },
      {
        title: "Exceptions",
        body: "In some special cases, we may consider a refund for payment mistakes or duplicate payments. Please contact us within 48 hours of the payment and provide the necessary information.",
      },
      {
        title: "Contact Support",
        body: `If you have any problem with your payment or purchase, please contact us at ${SUPPORT_EMAIL}. Our team will check the issue and help you.`,
      },
    ],
  },
};
