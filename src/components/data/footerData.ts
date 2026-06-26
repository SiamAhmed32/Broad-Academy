import { contactDetails } from "@/components/data/contactData";
import { navLinks } from "@/components/data/navData";

export const footerTagline =
  "Empowering students from Class 6 to HSC with expert mentorship, structured learning, and family-centered support.";

/** Main site pages — mirrors the navbar, no duplicates elsewhere. */
export const footerNavLinks = navLinks;

/** Auth & onboarding only. */
export const footerAccountLinks = [
  { title: "Log In", href: "/login" },
  { title: "Get Started", href: "/register" },
];

export const footerContact = {
  email: contactDetails.email,
  emailHref: `mailto:${contactDetails.email}`,
  phone: contactDetails.phone,
  phoneHref: contactDetails.phoneHref,
  address: contactDetails.address,
  hours: contactDetails.hours,
};

export const footerSocialLinks = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    shortLabel: "Fb",
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
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
