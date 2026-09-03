import React from "react";

const TestimonialHeader = () => {
  return (
    <div className="relative flex flex-col items-center text-center pt-16 px-4">
      {/* heading */}
      <h2 className="relative z-10 max-w-3xl text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.1] tracking-tight text-navy">
        অভিভাবক ও শিক্ষার্থীদের অভিমত
      </h2>

      {/* dash-dot-dash divider */}
      <div className="relative z-10 mt-5 flex items-center gap-2">
        <span className="h-[3px] w-8 rounded-full bg-indigo-600" />
        <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
        <span className="h-[3px] w-8 rounded-full bg-indigo-600" />
      </div>

      {/* description */}
      <p className="relative z-10 mt-6 max-w-2xl text-base sm:text-lg leading-relaxed text-accent">
        আমাদের শিক্ষা কার্যক্রমে অংশ নিয়ে শিক্ষার্থী ও অভিভাবকদের বাস্তব
        অভিজ্ঞতা, আস্থা এবং সাফল্যের গল্প জানুন।
      </p>
    </div>
  );
};

export default TestimonialHeader;