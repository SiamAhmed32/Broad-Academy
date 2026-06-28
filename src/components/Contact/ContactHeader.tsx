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
          ? "mx-auto w-full max-w-3xl px-1 text-center"
          : "mx-auto w-full max-w-2xl px-1 text-center"
      }
    >
      <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-navy/10 bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent shadow-sm sm:px-4 sm:text-xs sm:tracking-[0.16em]">
        Get in Touch
      </span>

      <h2
        className={
          isPage
            ? "mt-4 text-pretty text-2xl font-semibold tracking-tight text-navy sm:mt-5 sm:text-3xl lg:text-4xl xl:text-5xl"
            : "mt-4 text-pretty text-2xl font-semibold tracking-tight text-navy sm:text-3xl lg:text-4xl"
        }
      >
        We&apos;re Here to{" "}
        <span className="bg-gradient-to-r from-navy to-btnBg bg-clip-text text-transparent">
          Help You Succeed
        </span>
      </h2>

      <div className="mx-auto mt-4 h-[3px] w-16 rounded-full bg-gradient-to-r from-navy to-btnBg sm:mt-5" />

      <p className="mt-4 text-pretty text-sm leading-6 text-slate-600 sm:mt-5 sm:text-base sm:leading-7 lg:text-lg">
        Questions about courses, enrollment, or your child&apos;s learning path?
        Send us a message and our academic support team will guide you.
      </p>
    </div>
  );
};

export default ContactHeader;
