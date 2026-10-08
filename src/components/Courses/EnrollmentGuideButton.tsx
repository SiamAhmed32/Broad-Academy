"use client";

import { Play, PlayCircle, X } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import type { EnrollmentGuideVideo } from "@/lib/courses/types";

const subscribeNoop = () => () => {};

/** "কোর্সটি কিভাবে কিনবেন" — opens the enrollment guide video from site config. */
export default function EnrollmentGuideButton({
  video,
}: {
  video: EnrollmentGuideVideo | null;
}) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  // true on the client, false during SSR: the portal needs document.body.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (!video) {
    return (
      <button
        type="button"
        disabled
        className="flex w-full cursor-not-allowed items-center justify-center gap-2.5 rounded-xl border border-dashed border-navy/15 bg-[#f8fafc] px-4 py-3 text-left text-navy/45"
      >
        <PlayCircle className="h-5 w-5 shrink-0" />
        <span>
          <span className="font-bangla block text-sm font-semibold">কোর্সটি কিভাবে কিনবেন</span>
          <span className="block text-xs">Enrollment guide video coming soon</span>
        </span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group flex w-full items-center justify-center gap-2.5 rounded-xl border border-btnBg/25 bg-btnBg/[0.06] px-4 py-3.5 text-btnBg transition hover:border-btnBg/45 hover:bg-btnBg/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btnBg/40"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-btnBg text-white shadow-sm shadow-btnBg/30 transition group-hover:scale-110">
          <Play className="ml-0.5 h-3.5 w-3.5 fill-current" />
        </span>
        <span className="font-bangla text-[15px] font-semibold">কোর্সটি কিভাবে কিনবেন</span>
      </button>

      {open && mounted
        ? createPortal(
            <div
              className="fixed inset-0 z-[160] flex items-center justify-center bg-navy/75 p-3 backdrop-blur-sm sm:p-6"
              onClick={() => setOpen(false)}
            >
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="enrollment-guide-title"
                className="w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-5">
                  <p
                    id="enrollment-guide-title"
                    className="font-bangla text-base font-semibold text-navy"
                  >
                    কোর্সটি কিভাবে কিনবেন
                  </p>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={() => setOpen(false)}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-navy/55 transition hover:bg-navy/5 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-btnBg/40"
                    aria-label="Close video"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="aspect-video w-full bg-black">
                  {/* youtube-nocookie: the only YouTube host allowed by the site CSP (frame-src). */}
                  <iframe
                    src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                    title="কোর্সটি কিভাবে কিনবেন"
                    className="h-full w-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
