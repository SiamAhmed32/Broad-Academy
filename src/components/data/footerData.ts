import { contactDetails } from "@/components/data/contactData";
import type { NavSession } from "@/lib/nav/types";
import { navLinks } from "@/components/data/navData";

export const footerTagline =
  "Empowering students from Class 6 to HSC with expert mentorship, structured learning, and family-centered support.";

/** Main site pages — mirrors the navbar, no duplicates elsewhere. */
export const footerNavLinks = navLinks;

export const footerContact = {
  email: contactDetails.email,
  emailHref: `mailto:${contactDetails.email}`,
  phone: contactDetails.phone,
  phoneHref: contactDetails.phoneHref,
  whatsappHref: contactDetails.whatsappHref,
  technicalWhatsapp: contactDetails.technicalWhatsapp,
  technicalWhatsappHref: contactDetails.technicalWhatsappHref,
  address: contactDetails.address,
  hours: contactDetails.hours,
};

export const footerSocialLinks = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/broadacademybd/",
    shortLabel: "Fb",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/c/BroadAcademy",
    shortLabel: "Yt",
  },
  {
    label: "LinkedIn",
    href: "https://linkedin.com",
    shortLabel: "In",
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    shortLabel: "Ig",
  },
] as const;

/** Legal pages — shown once in the bottom bar only. */
export const footerLegalLinks = [
  { title: "Privacy Policy", href: "/privacy-policy" },
  { title: "Terms & Conditions", href: "/terms-and-conditions" },
  { title: "Refund Policy", href: "/refund-policy" },
];

/** Account column — reflects whether someone is signed in, and their role. */
export function footerAccountLinksFor(navSession: NavSession | null) {
  if (!navSession) {
    return [
      { title: "Log In", href: "/login" },
      { title: "Get Started", href: "/register" },
    ];
  }

  if (navSession.role === "ADMIN") {
    return [
      { title: "Admin panel", href: "/admin" },
      { title: "Manage courses", href: "/admin/courses" },
      { title: "Manage students", href: "/admin/students" },
    ];
  }

  return [
    { title: "My dashboard", href: "/dashboard" },
    { title: "My profile", href: "/dashboard/profile" },
    { title: "Submit documents", href: "/submit-documents" },
  ];
}
