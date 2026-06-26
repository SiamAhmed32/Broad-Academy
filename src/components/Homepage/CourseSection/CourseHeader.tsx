import { Sparkles } from "lucide-react";

const CourseHeader = ({ featuredCount = 0 }: { featuredCount?: number }) => {
  return (
    <div className="flex flex-col items-center px-2 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-btnBg/15 bg-white px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-btnBg shadow-sm">
        <Sparkles className="h-3.5 w-3.5" />
        Featured learning paths
      </span>

      <h2 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight tracking-[-0.04em] text-navy sm:text-4xl lg:text-[2.65rem]">
        Courses built for
        <span className="block bg-gradient-to-r from-navy via-[#0d4f8b] to-btnBg bg-clip-text text-transparent">
          real exam success
        </span>
      </h2>

      <p className="mt-4 max-w-2xl text-base leading-7 text-navy/65 sm:text-lg">
        Explore structured programs designed for Bangladeshi students — from
        foundational skills to board and admission preparation.
      </p>

      {featuredCount > 0 ? (
        <p className="mt-3 text-xs font-medium text-navy/45">
          Showing {featuredCount} admin-picked featured course
          {featuredCount === 1 ? "" : "s"} first
        </p>
      ) : null}

      <div className="mt-6 h-1 w-14 rounded-full bg-gradient-to-r from-navy to-btnBg" />
    </div>
  );
};

export default CourseHeader;
