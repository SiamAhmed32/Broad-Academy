import type { LucideIcon } from "lucide-react";
import {
  BookOpenCheck,
  CreditCard,
  FileCheck2,
  GraduationCap,
  HelpCircle,
  LockKeyhole,
  RefreshCcw,
  Scale,
  ShieldCheck,
  UserCheck,
} from "lucide-react";

export type LegalPageSlug =
  | "privacy-policy"
  | "terms-and-conditions"
  | "refund-policy";

export type LegalPageSection = {
  title: string;
  description: string;
  points: string[];
};

export type LegalPageData = {
  slug: LegalPageSlug;
  eyebrow: string;
  title: string;
  description: string;
  lastUpdated: string;
  icon: LucideIcon;
  highlights: {
    label: string;
    value: string;
    icon: LucideIcon;
  }[];
  sections: LegalPageSection[];
};

export const legalPagesData: Record<LegalPageSlug, LegalPageData> = {
  "privacy-policy": {
    slug: "privacy-policy",
    eyebrow: "Privacy Policy",
    title: "How We Protect Student and Guardian Information",
    description:
      "This policy explains how Broad Academy may collect, use, protect, and manage personal information when students or guardians use our learning platform.",
    lastUpdated: "April 30, 2026",
    icon: ShieldCheck,
    highlights: [
      {
        label: "Student safety",
        value: "Protected learning data",
        icon: LockKeyhole,
      },
      {
        label: "Guardian trust",
        value: "Clear data usage",
        icon: UserCheck,
      },
      {
        label: "Academic focus",
        value: "Only necessary details",
        icon: GraduationCap,
      },
    ],
    sections: [
      {
        title: "Information We May Collect",
        description:
          "We collect only the information needed to provide learning support, course access, consultation, and student progress guidance.",
        points: [
          "Student name, class level, learning goals, and selected courses.",
          "Guardian name, phone number, email address, and communication preferences.",
          "Payment-related confirmation details when paid courses are introduced.",
          "Basic usage information that helps us improve lessons, support, and platform experience.",
        ],
      },
      {
        title: "How We Use Information",
        description:
          "Information is used to support students, communicate with guardians, and maintain a reliable education experience.",
        points: [
          "To enroll students in courses and provide academic guidance.",
          "To contact students or guardians about classes, updates, support, or consultation.",
          "To improve course quality, learning materials, and student support.",
          "To maintain account security and prevent misuse of the platform.",
        ],
      },
      {
        title: "How We Keep Information Safe",
        description:
          "Student and guardian information should be handled carefully, with access limited to the people who need it for support and operations.",
        points: [
          "We aim to keep personal data secure and avoid unnecessary sharing.",
          "Access to sensitive student or guardian information should be limited.",
          "We do not sell student or guardian information to third parties.",
          "Payment information should be handled through trusted payment providers when payments are enabled.",
        ],
      },
      {
        title: "Contact and Data Requests",
        description:
          "Guardians and students may contact Broad Academy for questions about their information or to request updates.",
        points: [
          "You may ask us to correct inaccurate student or guardian information.",
          "You may request information about how your data is being used.",
          "Some information may need to be retained for legal, payment, or support records.",
        ],
      },
    ],
  },
  "terms-and-conditions": {
    slug: "terms-and-conditions",
    eyebrow: "Terms & Conditions",
    title: "Rules for Using Broad Academy Courses and Services",
    description:
      "These terms define how students, guardians, and visitors should use Broad Academy courses, content, consultation, and digital learning services.",
    lastUpdated: "April 30, 2026",
    icon: Scale,
    highlights: [
      {
        label: "Fair usage",
        value: "Respectful learning",
        icon: UserCheck,
      },
      {
        label: "Course access",
        value: "Student-first rules",
        icon: BookOpenCheck,
      },
      {
        label: "Content safety",
        value: "Protected materials",
        icon: FileCheck2,
      },
    ],
    sections: [
      {
        title: "Using Our Platform",
        description:
          "Students and guardians should use Broad Academy responsibly and only for educational purposes.",
        points: [
          "Students should provide accurate information during enrollment or consultation.",
          "Course access should not be shared with unauthorized users.",
          "Users should not misuse, copy, resell, or distribute course content without permission.",
          "Broad Academy may update course structure, schedules, or materials when needed.",
        ],
      },
      {
        title: "Courses and Learning Content",
        description:
          "Our course content is prepared to support academic learning, revision, and exam preparation.",
        points: [
          "Course descriptions, topics, teachers, and pricing may be updated over time.",
          "Learning outcomes depend on student effort, attendance, practice, and consistency.",
          "Recorded or digital materials remain the intellectual property of Broad Academy or its content partners.",
          "Students should follow class rules and maintain respectful behavior with teachers and support staff.",
        ],
      },
      {
        title: "Accounts, Payments, and Access",
        description:
          "When account and payment features are added, students and guardians will be responsible for keeping access details safe.",
        points: [
          "Paid course access may begin after successful payment confirmation.",
          "Incorrect information may delay enrollment, support, or access.",
          "Broad Academy may restrict access if a user violates platform rules.",
          "Payment and refund matters will follow the Refund Policy.",
        ],
      },
      {
        title: "Changes to Terms",
        description:
          "These terms may be updated as the platform grows, adds features, or changes its course model.",
        points: [
          "Important updates should be reflected on this page.",
          "Continued use of the platform means users accept the latest terms.",
          "Users should review this page periodically for changes.",
        ],
      },
    ],
  },
  "refund-policy": {
    slug: "refund-policy",
    eyebrow: "Refund Policy",
    title: "A Clear Refund Process for Paid Courses",
    description:
      "This refund policy explains how refund requests may be handled when Broad Academy starts offering paid courses, subscriptions, or consultation-based programs.",
    lastUpdated: "April 30, 2026",
    icon: RefreshCcw,
    highlights: [
      {
        label: "Clear process",
        value: "Simple refund request",
        icon: HelpCircle,
      },
      {
        label: "Payment safety",
        value: "Reviewed fairly",
        icon: CreditCard,
      },
      {
        label: "Student support",
        value: "Guidance before purchase",
        icon: BookOpenCheck,
      },
    ],
    sections: [
      {
        title: "Refund Eligibility",
        description:
          "Refund eligibility may depend on the course type, access status, payment method, and time of request.",
        points: [
          "Refund requests should be made within the stated refund window for the course.",
          "Refunds may not apply after significant course access, downloads, or class participation.",
          "Duplicate payments or accidental payments should be reviewed with proper proof.",
          "Special batch, promotional, or discounted courses may have separate refund rules.",
        ],
      },
      {
        title: "How to Request a Refund",
        description:
          "Guardians or students should contact Broad Academy support with payment and enrollment details.",
        points: [
          "Provide the student name, course name, payment date, and transaction reference if available.",
          "Explain the reason for the refund request clearly.",
          "Our support team may verify course access and payment records before approval.",
          "Approved refunds should be processed through the original or agreed payment method.",
        ],
      },
      {
        title: "Non-Refundable Cases",
        description:
          "Some cases may not qualify for refund, especially when course value has already been delivered.",
        points: [
          "Completed courses, attended live classes, or heavily accessed materials may not be refundable.",
          "Refunds may not apply for account sharing, misuse, or violation of platform rules.",
          "Service charges from payment providers may be non-refundable.",
          "Refund requests without valid payment proof may be declined.",
        ],
      },
      {
        title: "Support Before Payment",
        description:
          "We encourage guardians and students to ask questions before enrolling in a paid course.",
        points: [
          "Use consultation support to choose the right course before payment.",
          "Review class level, course content, schedule, and learning goals carefully.",
          "Contact support if you are unsure which course is suitable.",
        ],
      },
    ],
  },
};
