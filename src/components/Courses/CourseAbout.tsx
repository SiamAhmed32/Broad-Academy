"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * "কোর্স সম্পর্কে" text, clamped to a few lines with a
 * "পূর্ণাঙ্গ দেখুন" / "সংক্ষেপে দেখুন" toggle that only appears when the
 * text is actually longer than the clamp.
 */
export default function CourseAbout({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  // Server-safe first guess (avoids the toggle popping in after hydration);
  // the ResizeObserver below replaces it with the real measurement.
  const [overflowing, setOverflowing] = useState(
    () => text.length > 360 || text.split("\n").length > 6,
  );
  const textRef = useRef<HTMLDivElement>(null);
  const contentId = useId();

  useEffect(() => {
    const element = textRef.current;
    if (!element || expanded) return;

    // Re-measure on resize: the same text can fit on desktop but not on mobile.
    const observer = new ResizeObserver(() => {
      setOverflowing(element.scrollHeight > element.clientHeight + 1);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [expanded]);

  return (
    <div>
      <div className="relative">
        <div
          id={contentId}
          ref={textRef}
          className={cn(
            "font-bangla whitespace-pre-line break-words text-[15px] leading-[1.9] text-body sm:text-base",
            !expanded && "line-clamp-6",
          )}
        >
          {text}
        </div>
        {!expanded && overflowing ? (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent"
          />
        ) : null}
      </div>

      {overflowing ? (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="font-bangla mt-4 inline-flex items-center gap-1.5 rounded-full border border-btnBg/20 bg-btnBg/5 px-4 py-2 text-sm font-semibold text-btnBg transition hover:border-btnBg/40 hover:bg-btnBg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btnBg/40"
        >
          {expanded ? "সংক্ষেপে দেখুন" : "পূর্ণাঙ্গ দেখুন"}
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", expanded && "rotate-180")}
          />
        </button>
      ) : null}
    </div>
  );
}
