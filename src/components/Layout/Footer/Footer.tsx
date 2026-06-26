import {
  Clock3,
  Mail,
  MapPin,
  Phone,
} from "lucide-react";
import Link from "next/link";

import { BrandLogo } from "@/components/Brand";
import {
  footerAccountLinks,
  footerContact,
  footerLegalLinks,
  footerNavLinks,
  footerSocialLinks,
  footerTagline,
} from "@/components/data/footerData";
import { Container } from "@/components/reusables";

import BackToTop from "./BackToTop";
import FooterNewsletter from "./FooterNewsletter";

const linkColumn = (
  title: string,
  links: { title: string; href: string }[],
) => (
  <div>
    <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
      {title}
    </h3>
    <ul className="mt-5 space-y-3">
      {links.map((link) => (
        <li key={`${title}-${link.href}`}>
          <Link
            href={link.href}
            className="text-sm text-white/65 transition hover:text-white hover:underline underline-offset-4"
          >
            {link.title}
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  return (
    <footer className="relative overflow-hidden bg-navy text-soft">
      <div className="pointer-events-none absolute left-[-6rem] top-0 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-[-4rem] h-80 w-80 rounded-full bg-btnBg/15 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.08),transparent_40%)]" />

      <Container className="relative pt-14 sm:pt-16">
        <FooterNewsletter />

        <div className="mt-14 grid gap-10 border-t border-white/10 pt-12 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
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
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/8 text-xs font-bold text-white/80 transition hover:border-accent/40 hover:bg-accent/15 hover:text-white"
                >
                  {social.shortLabel}
                </a>
              ))}
            </div>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:col-span-4">
            {linkColumn("Navigation", footerNavLinks)}
            {linkColumn("Account", footerAccountLinks)}
          </div>

          <div className="lg:col-span-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              Contact
            </h3>
            <ul className="mt-5 space-y-4">
              <li>
                <a
                  href={footerContact.emailHref}
                  className="group flex items-start gap-3 text-sm text-white/65 transition hover:text-white"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-accent transition group-hover:bg-accent/15">
                    <Mail className="h-4 w-4" />
                  </span>
                  <span className="pt-1.5">{footerContact.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={footerContact.phoneHref}
                  className="group flex items-start gap-3 text-sm text-white/65 transition hover:text-white"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-accent transition group-hover:bg-accent/15">
                    <Phone className="h-4 w-4" />
                  </span>
                  <span className="pt-1.5">{footerContact.phone}</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/65">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-accent">
                  <MapPin className="h-4 w-4" />
                </span>
                <span className="pt-1.5">{footerContact.address}</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-white/65">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-accent">
                  <Clock3 className="h-4 w-4" />
                </span>
                <span className="pt-1.5 leading-6">{footerContact.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-5 border-t border-white/10 py-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/45">
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
