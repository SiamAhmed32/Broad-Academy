"use client";

import { useCallback, useEffect, useState } from "react";
import { Minus, Plus, RotateCcw, ZoomIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { cloudinaryDisplayImage } from "@/lib/media/images";

const ZOOM_STEPS = [1, 1.25, 1.5, 2, 2.5, 3] as const;

type QuestionImageViewerProps = {
  src: string;
  alt?: string;
};

export default function QuestionImageViewer({
  src,
  alt = "Question illustration",
}: QuestionImageViewerProps) {
  const [open, setOpen] = useState(false);
  const [zoomIndex, setZoomIndex] = useState(0);

  const scale = ZOOM_STEPS[zoomIndex];

  const resetZoom = useCallback(() => setZoomIndex(0), []);

  useEffect(() => {
    if (!open) resetZoom();
  }, [open, resetZoom]);

  function zoomIn() {
    setZoomIndex((i) => Math.min(i + 1, ZOOM_STEPS.length - 1));
  }

  function zoomOut() {
    setZoomIndex((i) => Math.max(i - 1, 0));
  }

  const displaySrc = cloudinaryDisplayImage(src, 1600);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative mb-6 block w-full overflow-hidden rounded-2xl border border-navy/10 bg-[#eef2f7] text-left shadow-sm transition hover:border-accent/30 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-accent/25"
        aria-label="Enlarge question image"
      >
        <div className="relative aspect-[4/3] w-full sm:aspect-[16/10]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={displaySrc}
            alt={alt}
            className="absolute inset-0 h-full w-full object-contain p-2 sm:p-3"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/25 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-navy shadow-md ring-1 ring-navy/10 transition group-hover:bg-white">
            <ZoomIn className="h-3.5 w-3.5 text-accent" />
            Tap to zoom
          </span>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[96vh] w-[calc(100%-1rem)] max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100%-2rem)]">
          <DialogHeader className="flex-row items-center justify-between gap-4 space-y-0 border-b border-navy/8 px-4 py-3 pr-14 sm:px-5">
            <DialogTitle className="text-base sm:text-lg">Question image</DialogTitle>
            <div className="flex items-center gap-1">
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={zoomOut}
                disabled={zoomIndex === 0}
                aria-label="Zoom out"
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="min-w-[3.5rem] text-center text-xs font-semibold text-navy">
                {Math.round(scale * 100)}%
              </span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="h-9 w-9"
                onClick={zoomIn}
                disabled={zoomIndex === ZOOM_STEPS.length - 1}
                aria-label="Zoom in"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-9 w-9"
                onClick={resetZoom}
                disabled={zoomIndex === 0}
                aria-label="Reset zoom"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="overflow-auto bg-[#1a1a1a] p-3 sm:p-4">
            <div
              className={cn(
                "mx-auto flex min-h-[50vh] items-center justify-center",
                scale > 1 ? "min-w-max" : "w-full",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={displaySrc}
                alt={alt}
                className="max-w-none select-none transition-transform duration-200 ease-out"
                style={{
                  transform: `scale(${scale})`,
                  transformOrigin: "center center",
                  maxHeight: scale === 1 ? "min(70vh, 900px)" : undefined,
                  width: scale === 1 ? "100%" : "auto",
                  objectFit: "contain",
                }}
                draggable={false}
              />
            </div>
          </div>

          <div className="border-t border-navy/8 px-4 py-3 text-center text-xs text-slate-500 sm:px-5">
            Scroll to pan when zoomed in · Pinch or use +/− buttons
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
