import React from "react";

const TestimonialHeader = () => {
  return (
    <div className="relative flex flex-col items-center text-center mt-28 px-4">
      
      {/* subtle background glow */}
      <div className="absolute -top-10 h-40 w-40 bg-blue-500/10 blur-3xl rounded-full" />

      {/* badge */}
      <span className="relative z-10 mb-5 inline-flex items-center gap-2 rounded-full border border-navy/15 bg-white/60 backdrop-blur-md px-5 py-1.5 text-xs font-semibold tracking-wide text-accent shadow-sm">
        ⭐ Student Success Stories
      </span>

      {/* heading */}
      <h2 className="relative z-10 max-w-3xl text-3xl sm:text-4xl lg:text-5xl font-semibold leading-[1.1] tracking-tight text-navy">
        Trusted by{" "}
        <span className="bg-gradient-to-r from-navy to-blue-500 bg-clip-text text-transparent">
          Students & Parents
        </span>
      </h2>

      {/* divider accent */}
      <div className="relative z-10 mt-6 h-[3px] w-16 rounded-full bg-gradient-to-r from-navy to-btnBg" />

      {/* description */}
      <p className="relative z-10 mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-navy/70">
        Real experiences from learners and guardians who achieved clearer
        direction, stronger preparation, and lasting confidence with{" "}
        <span className="font-medium text-navy">Broad Academy</span>.
      </p>
    </div>
  );
};

export default TestimonialHeader;