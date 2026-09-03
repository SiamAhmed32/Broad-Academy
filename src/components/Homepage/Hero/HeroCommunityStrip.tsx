import { WHATSAPP_COMMUNITY_URL } from "@/lib/site/community";
import { footerSocialLinks } from "@/components/data/footerData";
import {
  FacebookIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/icons/BrandIcons";

const facebookHref =
  footerSocialLinks.find((link) => link.label === "Facebook")?.href ??
  "https://facebook.com";
const youtubeHref =
  footerSocialLinks.find((link) => link.label === "YouTube")?.href ??
  "https://youtube.com";

const communityLinks = [
  {
    label: "Facebook",
    description: "Updates & announcements",
    cta: "Follow us",
    href: facebookHref,
    icon: FacebookIcon,
    color: "#1877F2",
  },
  {
    label: "WhatsApp",
    description: "Chat with our support team",
    cta: "Message us",
    href: WHATSAPP_COMMUNITY_URL,
    icon: WhatsAppIcon,
    color: "#25D366",
  },
  {
    label: "YouTube",
    description: "Free lessons & tips",
    cta: "Subscribe",
    href: youtubeHref,
    icon: YouTubeIcon,
    color: "#FF0000",
  },
];

const HeroCommunityStrip = () => {
  return (
    <div className="mt-10 rounded-2xl border border-navy/10 bg-white p-5 shadow-[0_10px_30px_rgba(22,51,81,0.06)] sm:mt-12 sm:p-6">
      <p className="text-sm font-semibold text-navy">
        Join our community
      </p>
      <p className="mt-1 text-xs text-navy/55">
        Stay updated with lessons, tips, and announcements.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {communityLinks.map(({ label, description, cta, href, icon: Icon, color }) => (
          <a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 rounded-xl border border-navy/8 bg-white px-3 py-3 transition hover:-translate-y-0.5 hover:border-navy/15 hover:shadow-md"
          >
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
              style={{ backgroundColor: `${color}1a`, color }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-navy">
                {label}
              </span>
              <span className="block truncate text-xs text-navy/50">
                {description}
              </span>
            </span>
            <span
              className="ml-auto shrink-0 text-xs font-semibold transition group-hover:underline"
              style={{ color }}
            >
              {cta}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};

export default HeroCommunityStrip;
