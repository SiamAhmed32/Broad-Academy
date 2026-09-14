import { Clock3, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";

import BrandLogo from "@/components/Brand/BrandLogo";
import {
  footerAccountLinksFor,
  footerContact,
  footerLegalLinks,
  footerNavLinks,
  footerSocialLinks,
  footerTagline,
} from "@/components/data/footerData";
import { WhatsAppIcon } from "@/components/icons/BrandIcons";
import { Container } from "@/components/reusables";
import type { NavSession } from "@/lib/nav/types";

import BackToTop from "./BackToTop";

const LinkColumn = ({
  title,
  links,
}: {
  title: string;
  links: { title: string; href: string }[];
}) => (
  <div>
    <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8ec5ff]">
      {title}
    </h3>
    <ul className="mt-5 space-y-3">
      {links.map((link) => (
        <li key={`${title}-${link.href}`}>
          <Link
            href={link.href}
            className="text-sm text-white/65 underline-offset-4 transition hover:text-[#8ec5ff] hover:underline"
          >
            {link.title}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const ContactRow = ({
  icon: Icon,
  children,
  href,
}: {
  icon: ComponentType<{ className?: string }>;
  children: React.ReactNode;
  href?: string;
}) => {
  const content = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-[#8ec5ff] transition group-hover:bg-btnBg/25">
        <Icon className="h-4 w-4" />
      </span>
      <span className="pt-1.5 leading-6">{children}</span>
    </>
  );

  return (
    <li>
      {href ? (
        <a
          href={href}
          className="group flex items-start gap-3 text-sm text-white/65 transition hover:text-white"
          {...(href.startsWith("http")
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
        >
          {content}
        </a>
      ) : (
        <div className="group flex items-start gap-3 text-sm text-white/65">
          {content}
        </div>
      )}
    </li>
  );
};

const Footer = ({ navSession }: { navSession?: NavSession | null }) => {
  const accountLinks = footerAccountLinksFor(navSession ?? null);

  return (
    <footer className="relative overflow-hidden bg-navy text-soft">
      <div className="pointer-events-none absolute left-[-6rem] top-0 h-72 w-72 rounded-full bg-btnBg/12 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-[-4rem] h-80 w-80 rounded-full bg-btnBg/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_40%)]" />

      <Container className="relative pt-14 sm:pt-16">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-4">
            <BrandLogo inverse />
            <p className="mt-5 max-w-sm text-sm leading-7 text-white/65">
              {footerTagline}
            </p>

            <div className="mt-6 flex flex-wrap gap-2.5">
              {footerSocialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.label}
                  title={social.label}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/8 text-xs font-bold text-white/80 transition hover:border-btnBg/50 hover:bg-btnBg/20 hover:text-white"
                >
                  {social.shortLabel}
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-4">
            <LinkColumn title="Navigation" links={footerNavLinks} />
            <LinkColumn title="Account" links={accountLinks} />
          </div>

          <div className="lg:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8ec5ff]">
              Contact
            </h3>
            <ul className="mt-5 space-y-4">
              <ContactRow icon={Mail} href={footerContact.emailHref}>
                {footerContact.email}
              </ContactRow>
              <ContactRow icon={Phone} href={footerContact.phoneHref}>
                {footerContact.phone}
              </ContactRow>
              <ContactRow icon={MapPin}>{footerContact.address}</ContactRow>
              <ContactRow icon={Clock3}>{footerContact.hours}</ContactRow>
              <ContactRow icon={WhatsAppIcon} href={footerContact.technicalWhatsappHref}>
                সাইট সহায়তা {footerContact.technicalWhatsapp}
              </ContactRow>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-white/10 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/45" suppressHydrationWarning>
            © {new Date().getFullYear()} Broad Academy. All rights reserved.
          </p>

          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            {footerLegalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-white/55 transition hover:text-white"
              >
                {link.title}
              </Link>
            ))}
          </div>

          <BackToTop />
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
