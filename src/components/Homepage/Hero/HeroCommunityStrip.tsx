"use client";

import { WHATSAPP_COMMUNITY_URL } from "@/lib/site/community";
import { footerSocialLinks } from "@/components/data/footerData";
import {
  FacebookIcon,
  WhatsAppIcon,
  YouTubeIcon,
} from "@/components/icons/BrandIcons";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

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
    // Glossy tile: light top-left to deep bottom-right of the brand colour
    tile: "linear-gradient(145deg, #5AA2FF 0%, #1877F2 55%, #0B4FC4 100%)",
  },
  {
    label: "WhatsApp",
    description: "Chat with our support team",
    cta: "Message us",
    href: WHATSAPP_COMMUNITY_URL,
    icon: WhatsAppIcon,
    color: "#1FAF55",
    tile: "linear-gradient(145deg, #6BEA98 0%, #25D366 55%, #128C4A 100%)",
  },
  {
    label: "YouTube",
    description: "Free lessons & tips",
    cta: "Subscribe",
    href: youtubeHref,
    icon: YouTubeIcon,
    color: "#E11D1D",
    tile: "linear-gradient(145deg, #FF7A7A 0%, #FF0000 55%, #B80000 100%)",
  },
];

const HeroCommunityStrip = () => {
  const shouldReduceMotion = useReducedMotion();

  const listVariants: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: shouldReduceMotion ? 0 : 0.1 } },
  };

  const cardVariants: Variants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.45, ease: "easeOut" },
    },
  };

  return (
    <div className="mt-10 rounded-2xl border border-navy/10 bg-white p-5 shadow-[0_10px_30px_rgba(22,51,81,0.06)] sm:mt-12 sm:p-6">
      <p lang="bn" className="font-bangla text-base font-semibold leading-snug text-navy">
        আমাদের কমিউনিটির সাথে যুক্ত থাকুন
      </p>
      <p lang="bn" className="font-bangla mt-1.5 max-w-2xl text-sm font-medium leading-[1.85] text-navy/55">
        শিক্ষামূলক আপডেট, ফ্রি রিসোর্স এবং গুরুত্বপূর্ণ ঘোষণাগুলো সবার আগে পেতে আমাদের
        সাথে থাকুন।
      </p>

      <motion.div
        className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3"
        variants={listVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.4 }}
      >
        {communityLinks.map(({ label, description, cta, href, icon: Icon, color, tile }) => (
          <motion.a
            key={label}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            variants={cardVariants}
            className="group relative flex items-center gap-3.5 overflow-hidden rounded-xl border border-navy/8 bg-white px-3.5 py-3.5 transition duration-300 hover:-translate-y-1 hover:shadow-[0_14px_30px_-12px_var(--brand)]"
            style={{ "--brand": `${color}66` } as React.CSSProperties}
          >
            {/* Soft brand wash that fades in on hover */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: `linear-gradient(90deg, ${color}12, transparent 70%)` }}
            />

            {/* Glossy 3D icon tile */}
            <span
              className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110"
              style={{
                background: tile,
                boxShadow: `0 8px 18px -6px ${color}99, inset 0 1px 0 rgba(255,255,255,0.45), inset 0 -3px 6px rgba(0,0,0,0.18)`,
              }}
            >
              <span
                aria-hidden
                className="absolute inset-x-1.5 top-1 h-1/2 rounded-t-xl bg-gradient-to-b from-white/35 to-transparent"
              />
              <Icon className="relative h-6 w-6 drop-shadow-[0_1px_1px_rgba(0,0,0,0.25)]" />
            </span>

            <span className="relative min-w-0">
              <span className="block text-sm font-semibold text-navy">
                {label}
              </span>
              <span className="block truncate text-xs text-navy/55">
                {description}
              </span>
            </span>

            <span
              className="relative ml-auto inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-semibold"
              style={{ color, backgroundColor: `${color}14` }}
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ backgroundColor: color }}
              />
              <span className="relative transition-colors duration-300 group-hover:text-white">{cta}</span>
              <ArrowUpRight className="relative h-3.5 w-3.5 transition duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-white" />
            </span>
          </motion.a>
        ))}
      </motion.div>
    </div>
  );
};

export default HeroCommunityStrip;
