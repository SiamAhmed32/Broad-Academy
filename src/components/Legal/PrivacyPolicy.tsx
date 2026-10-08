import { Mail } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/reusables";

const LAST_UPDATED = "October 9, 2026";
const SUPPORT_EMAIL = "support.broadacademy@gmail.com";

const sections = [
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
];

const PrivacyPolicy = () => {
  return (
    <main className="bg-heroBg/60">
      <Container>
        <article className="mx-auto max-w-3xl py-16 sm:py-20 lg:py-24">
          <header className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-navy sm:text-5xl">
              Privacy Policy
            </h1>
            <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-accent" />
          </header>

          <p className="mt-10 text-lg leading-8 text-navy sm:text-xl sm:leading-9">
            Broad Academy respects your privacy and takes care of your personal
            information. This Privacy Policy explains what information we
            collect, how we use it, and how we keep it safe.
          </p>

          <ol className="mt-12 space-y-10">
            {sections.map((section, index) => (
              <li key={section.title} id={`section-${index + 1}`}>
                <h2 className="text-xl font-semibold text-navy sm:text-2xl">
                  <span className="text-accent">{index + 1}.</span>{" "}
                  {section.title}
                </h2>
                <p className="mt-3 text-base leading-8 text-body sm:text-lg">
                  {section.body}
                </p>
              </li>
            ))}
          </ol>

          <footer className="mt-14 border-t border-navy/10 pt-8">
            <p className="text-base text-body">
              Last updated:{" "}
              <span className="font-medium text-navy">{LAST_UPDATED}</span>
            </p>
            <Link
              href={`mailto:${SUPPORT_EMAIL}`}
              className="mt-4 inline-flex items-center gap-2 text-base font-medium text-accent transition-colors hover:text-btnBgDark"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {SUPPORT_EMAIL}
            </Link>
          </footer>
        </article>
      </Container>
    </main>
  );
};

export default PrivacyPolicy;
