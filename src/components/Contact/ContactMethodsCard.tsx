import { Clock3, Mail, MapPin, Phone } from "lucide-react";

import { contactDetails } from "@/components/data/contactData";
import { WhatsAppIcon } from "@/components/icons/BrandIcons";

const methods = [
  {
    icon: Phone,
    label: "ফোন / WhatsApp",
    value: contactDetails.phone,
    tag: "কল ও WhatsApp",
    links: [
      { href: contactDetails.phoneHref, label: "কল" },
      { href: contactDetails.whatsappHref, label: "WhatsApp" },
    ],
  },
  {
    icon: Mail,
    label: "ইমেইল",
    value: contactDetails.email,
    tag: "২৪/৭ সহায়তা",
    href: `mailto:${contactDetails.email}`,
  },
  {
    icon: MapPin,
    label: "অফিস ঠিকানা",
    value: contactDetails.address,
    tag: "সরাসরি দেখা করুন",
  },
  {
    icon: Clock3,
    label: "সাপোর্ট সময়",
    value: contactDetails.hours,
    tag: "২৪/৭ সহায়তা",
  },
  {
    icon: WhatsAppIcon,
    label: "WhatsApp",
    value: contactDetails.technicalWhatsapp,
    tag: "সাইট সহায়তা",
    href: contactDetails.technicalWhatsappHref,
  },
] as const;

const ContactMethodsCard = () => {
  return (
    <div className="rounded-3xl border border-[#EDF0F5] bg-white p-5 shadow-[0_10px_40px_-20px_rgba(2,88,250,0.12)] sm:p-6">
      <h3 className="text-base font-bold text-[#0D1321] sm:text-lg">
        যোগাযোগের উপায়
      </h3>

      <ul className="mt-5 flex flex-col gap-5">
        {methods.map((method) => {
          const Icon = method.icon;
          const content = (
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#EEF4FF] text-[#125BFF]">
                <Icon className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#125BFF]">
                    {method.label}
                  </p>
                  <span className="shrink-0 text-right text-[11px] font-medium leading-4 text-[#16A34A]">
                    {method.tag}
                  </span>
                </div>
                <p className="mt-1 break-words text-sm font-semibold text-[#0D1321]">
                  {method.value}
                </p>
                {"links" in method ? (
                  <p className="mt-1.5 flex gap-3 text-xs font-semibold text-[#125BFF]">
                    {method.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        target={link.href.startsWith("http") ? "_blank" : undefined}
                        rel={
                          link.href.startsWith("http")
                            ? "noopener noreferrer"
                            : undefined
                        }
                        className="hover:underline"
                      >
                        {link.label}
                      </a>
                    ))}
                  </p>
                ) : null}
              </div>
            </div>
          );

          if ("links" in method) {
            return <li key={method.label}>{content}</li>;
          }

          if ("href" in method && method.href) {
            return (
              <li key={method.label}>
                <a
                  href={method.href}
                  target={method.href.startsWith("http") ? "_blank" : undefined}
                  rel={
                    method.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  className="block transition hover:opacity-80"
                >
                  {content}
                </a>
              </li>
            );
          }

          return <li key={method.label}>{content}</li>;
        })}
      </ul>
    </div>
  );
};

export default ContactMethodsCard;
