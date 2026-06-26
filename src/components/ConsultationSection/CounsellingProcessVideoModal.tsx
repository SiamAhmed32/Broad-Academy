"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  Play,
  Sparkles,
  UserRoundCheck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

// Replace only this ID when the official counselling process video is ready.
const COUNSELLING_PROCESS_VIDEO_ID = "M7lc1UVf-VE";

const processSteps = [
  {
    icon: ClipboardList,
    title: "Submit your request",
    description: "Share parent contact details, your child’s class, subject need, and preferred date.",
  },
  {
    icon: UserRoundCheck,
    title: "Our team reviews it",
    description: "We confirm availability, explain the parent counselling fee, and help finalize the session.",
  },
  {
    icon: CalendarCheck,
    title: "Parents meet the advisor",
    description: "Join the confirmed session and receive practical academic guidance for your child.",
  },
];

export default function CounsellingProcessVideoModal({
  open,
  onClose,
  onBook,
}: {
  open: boolean;
  onClose: () => void;
  onBook: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [playing, setPlaying] = useState(false);

  const closeModal = useCallback(() => {
    setPlaying(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeModal();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeModal, open]);

  function startBooking() {
    closeModal();
    window.setTimeout(onBook, reduceMotion ? 0 : 180);
  }

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[170] flex items-end justify-center bg-slate-950/75 p-0 backdrop-blur-md sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <motion.section
            role="dialog"
            aria-modal="true"
            aria-labelledby="counselling-process-video-title"
            initial={reduceMotion ? false : { opacity: 0, y: 28, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative max-h-[94vh] w-full max-w-6xl overflow-y-auto rounded-t-[2rem] bg-[#f7fafc] shadow-[0_32px_120px_rgba(0,0,0,.4)] sm:rounded-[2rem]"
          >
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeModal}
              className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/55 text-white backdrop-blur-md transition hover:rotate-90 hover:bg-black/80 focus:outline-none focus:ring-2 focus:ring-accent sm:right-5 sm:top-5"
              aria-label="Close counselling process video"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="grid lg:grid-cols-[1.45fr_0.75fr]">
              <div className="bg-[#071b2d] p-3 sm:p-6 lg:flex lg:min-h-[660px] lg:items-center">
                <div className="w-full">
                  <div className="mb-4 px-2 text-white sm:mb-5">
                    <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#70e2bd]">
                      <Sparkles className="h-4 w-4" />
                      Counselling guide
                    </div>
                    <h2
                      id="counselling-process-video-title"
                      className="mt-2 max-w-2xl text-xl font-semibold sm:text-2xl"
                    >
                      See how parents can book counselling
                    </h2>
                    <p className="mt-2 max-w-2xl text-sm leading-6 text-white/55">
                      Watch the parent request, confirmation, payment, and session process.
                    </p>
                  </div>

                  <div className="relative aspect-video overflow-hidden rounded-[1.4rem] border border-white/10 bg-black shadow-2xl sm:rounded-[1.75rem]">
                    {playing ? (
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${COUNSELLING_PROCESS_VIDEO_ID}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
                        title="How parents can book a Broad Academy counselling session"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="absolute inset-0 h-full w-full"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setPlaying(true)}
                        className="group absolute inset-0 flex w-full items-center justify-center overflow-hidden text-white"
                        aria-label="Play counselling process guide"
                      >
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(54,211,153,.35),transparent_28%),radial-gradient(circle_at_82%_75%,rgba(37,99,235,.35),transparent_30%),linear-gradient(145deg,#09233a,#103f61)]" />
                        <div className="absolute inset-0 opacity-15 [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:24px_24px]" />
                        <div className="relative px-6 text-center">
                          <motion.span
                            animate={
                              reduceMotion
                                ? undefined
                                : {
                                    boxShadow: [
                                      "0 0 0 0 rgba(112,226,189,.35)",
                                      "0 0 0 18px rgba(112,226,189,0)",
                                    ],
                                  }
                            }
                            transition={{ duration: 2, repeat: Infinity }}
                            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white text-navy shadow-2xl transition group-hover:scale-110"
                          >
                            <Play className="ml-1 h-8 w-8 fill-current" />
                          </motion.span>
                          <p className="mt-6 text-lg font-semibold">
                            Watch the parent booking process
                          </p>
                          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/60">
                            A short step-by-step guide before parents submit a request.
                          </p>
                          <span className="mt-5 inline-flex rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-xs font-semibold text-white/70 backdrop-blur-sm">
                            Placeholder video — official guide coming soon
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <aside className="flex flex-col p-5 sm:p-7 lg:p-9">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
                    Three simple steps
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-navy">
                    From parent request to guidance
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-500">
                    Parents stay in control. The fee and final schedule are confirmed before the session.
                  </p>
                </div>

                <ol className="mt-7 space-y-5">
                  {processSteps.map((step, index) => (
                    <motion.li
                      key={step.title}
                      initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.12 + index * 0.08 }}
                      className="flex gap-3.5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                        <step.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-navy">
                          {index + 1}. {step.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">
                          {step.description}
                        </p>
                      </div>
                    </motion.li>
                  ))}
                </ol>

                <div className="mt-7 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-emerald-900">
                    <CheckCircle2 className="h-4 w-4" />
                    No surprise charges for parents
                  </p>
                  <p className="mt-1.5 text-xs leading-5 text-emerald-800/70">
                    Our team quotes the session fee first. Parents can review it before submitting payment.
                  </p>
                </div>

                <div className="mt-7 lg:mt-auto lg:pt-8">
                  <button
                    type="button"
                    onClick={startBooking}
                    className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent px-5 text-sm font-bold text-white shadow-lg shadow-accent/20 transition hover:-translate-y-0.5 hover:bg-accent/90"
                  >
                    <CalendarCheck className="h-4 w-4" />
                    Book parent counselling now
                  </button>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-2 h-10 w-full rounded-xl text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-navy"
                  >
                    Continue exploring
                  </button>
                </div>
              </aside>
            </div>
          </motion.section>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
