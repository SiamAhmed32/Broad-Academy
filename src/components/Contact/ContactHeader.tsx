import React from "react";

type ContactHeaderProps = {
  variant?: "section" | "page";
};

const ContactHeader = ({ variant = "section" }: ContactHeaderProps) => {
  const isPage = variant === "page";

  return (
    <div
      className={
        isPage
          ? "mx-auto max-w-3xl text-center"
          : "mx-auto max-w-2xl text-center"
      }
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-navy/10 bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent shadow-sm">
        Get in Touch
      </span>

      <h2
        className={
          isPage
            ? "mt-5 text-4xl font-semibold tracking-tight text-navy sm:text-5xl"
            : "mt-4 text-3xl font-semibold tracking-tight text-navy sm:text-4xl"
        }
      >
        We&apos;re Here to{" "}
        <span className="bg-gradient-to-r from-navy to-btnBg bg-clip-text text-transparent">
          Help You Succeed
        </span>
      </h2>

      <div className="mx-auto mt-5 h-[3px] w-16 rounded-full bg-gradient-to-r from-navy to-btnBg" />

      <p className="mt-5 text-base leading-7 text-slate-600 sm:text-lg">
        Questions about courses, enrollment, or your child&apos;s learning path?
        Send us a message and our academic support team will guide you.
      </p>
    </div>
  );
};

export default ContactHeader;
