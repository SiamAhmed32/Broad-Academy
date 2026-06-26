"use client";

import { PlayCircle } from "lucide-react";
import { useState } from "react";

import type { EnrollmentGuideVideo } from "@/lib/courses/types";

export default function EnrollmentGuideButton({
  video,
}: {
  video: EnrollmentGuideVideo | null;
}) {
  const [open, setOpen] = useState(false);

  if (!video) {
    return (
      <button
        type="button"
        disabled
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-navy/15 bg-[#f8fafc] px-4 py-3.5 text-sm font-semibold text-navy/40"
      >
        <PlayCircle className="h-4 w-4" />
        Enrollment guide video coming soon
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-btnBg/20 bg-btnBg/5 px-4 py-3.5 text-sm font-semibold text-btnBg transition hover:bg-btnBg/10"
      >
        <PlayCircle className="h-4 w-4" />
        How to enroll — watch guide
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-navy/70 p-4 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-3xl overflow-hidden rounded-2xl bg-black shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="aspect-video w-full">
              <iframe
                src={`${video.embedUrl}?autoplay=1`}
                title="Enrollment guide"
                className="h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
              <p className="text-sm font-medium text-navy">
                Step-by-step enrollment walkthrough
              </p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold text-navy/60 hover:bg-navy/5"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
