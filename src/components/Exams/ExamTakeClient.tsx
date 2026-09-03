"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Send,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import QuestionImageViewer from "@/components/Exams/QuestionImageViewer";
import { cn } from "@/lib/utils";

type Option = {
  id: string;
  text: string;
  displayOrder: number;
};

type Question = {
  id: string;
  prompt: string;
  imageUrl: string | null;
  displayOrder: number;
  options: Option[];
};

type ExamMeta = {
  id: string;
  durationMinutes: number;
  totalMarks: number;
  negativeMarking: number;
};

type Answers = Record<string, string | null>;

function formatCountdown(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ExamTakeClient({ slug }: { slug: string }) {
  const router = useRouter();
  const startTimeRef = useRef(Date.now());
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const questionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const isManualScrollingRef = useRef(false);
  const manualScrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [exam, setExam] = useState<ExamMeta | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [autoSubmit, setAutoSubmit] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/exams/${slug}/questions`);
      const json = await res.json();
      if (!json.success) {
        setError(json.message ?? "Failed to load exam. Check your access.");
        setLoading(false);
        return;
      }
      setQuestions(json.data.questions);
      setExam(json.data.exam);
      setTimeLeft(json.data.exam.durationMinutes * 60);
      setLoading(false);
    }
    load();
  }, [slug]);

  useEffect(() => {
    if (!exam || loading) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setAutoSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [exam, loading]);

  const scrollToQuestion = useCallback(
    (index: number) => {
      if (index < 0 || index >= questions.length) return;
      const target = questionRefs.current[index];
      if (target) {
        isManualScrollingRef.current = true;
        if (manualScrollTimeoutRef.current) {
          clearTimeout(manualScrollTimeoutRef.current);
        }
        setCurrentIdx(index);
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        manualScrollTimeoutRef.current = setTimeout(() => {
          isManualScrollingRef.current = false;
        }, 700);
      }
    },
    [questions.length],
  );

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || questions.length === 0) return;

    let rafId: number | null = null;

    const onScroll = () => {
      if (isManualScrollingRef.current) return;

      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const containerHeight = container.clientHeight;

        // Scrolled near bottom -> activate last question
        if (container.scrollHeight - container.scrollTop - containerHeight < 80) {
          setCurrentIdx(questions.length - 1);
          return;
        }

        let activeIndex = 0;
        let minDistance = Infinity;

        for (let i = 0; i < questions.length; i++) {
          const el = questionRefs.current[i];
          if (!el) continue;
          const rect = el.getBoundingClientRect();
          const topDiff = rect.top - containerRect.top;
          const bottomDiff = rect.bottom - containerRect.top;

          if (topDiff <= 140 && bottomDiff >= 80) {
            activeIndex = i;
          } else if (topDiff > 140 && topDiff < minDistance && activeIndex === 0) {
            minDistance = topDiff;
          }
        }

        setCurrentIdx(activeIndex);
      });
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
      if (manualScrollTimeoutRef.current) {
        clearTimeout(manualScrollTimeoutRef.current);
      }
    };
  }, [questions.length]);

  const handleSubmit = useCallback(
    async (forced = false) => {
      if (submitting) return;
      setSubmitting(true);
      setConfirmSubmit(false);

      const timeTakenSec = Math.floor((Date.now() - startTimeRef.current) / 1000);

      const res = await fetch(`/api/exams/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, timeTakenSec }),
      });
      const json = await res.json();

      if (json.success) {
        router.push(`/exams/${slug}/result/${json.data.id}`);
      } else {
        setError(json.message ?? "Submission failed.");
        setSubmitting(false);
        if (forced) setAutoSubmit(false);
      }
    },
    [answers, slug, router, submitting],
  );

  useEffect(() => {
    if (autoSubmit) {
      void handleSubmit(true);
    }
  }, [autoSubmit, handleSubmit]);

  function selectAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === optionId ? null : optionId,
    }));
  }

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f6f8fb]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (error && !exam) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#f6f8fb] p-4">
        <Card className="max-w-md p-8 text-center">
          <AlertCircle size={48} className="mx-auto text-red-500" />
          <h2 className="mt-4 text-xl font-bold text-navy">Cannot Start Exam</h2>
          <p className="mt-2 text-slate-600">{error}</p>
          <Button className="mt-6" onClick={() => router.back()}>
            Go Back
          </Button>
        </Card>
      </div>
    );
  }

  const answeredCount = Object.values(answers).filter(Boolean).length;
  const progress = questions.length
    ? ((currentIdx + 1) / questions.length) * 100
    : 0;
  const isWarningTime = timeLeft <= 120;
  const isDangerTime = timeLeft <= 30;

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-[#f6f8fb]">
      <header className="shrink-0 border-b border-navy/10 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy">
              Question {currentIdx + 1} of {questions.length}
            </p>
            <p className="hidden text-xs text-slate-500 sm:block">
              {answeredCount}/{questions.length} answered
            </p>
          </div>

          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2 font-mono text-base font-bold",
              isDangerTime
                ? "animate-pulse border border-red-200 bg-red-50 text-red-600"
                : isWarningTime
                  ? "border border-amber-200 bg-amber-50 text-amber-700"
                  : "border border-slate-200 bg-heroBg text-navy",
            )}
          >
            <Clock size={16} className={isDangerTime ? "text-red-500" : "text-accent"} />
            {formatCountdown(timeLeft)}
          </div>

          <Button
            id="exam-submit-btn"
            size="sm"
            onClick={() => setConfirmSubmit(true)}
            disabled={submitting}
          >
            {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            <span className="hidden sm:inline">Submit</span>
          </Button>
        </div>
        <Progress value={progress} className="h-1 rounded-none" />
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-navy/10 bg-white p-4 lg:block">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            Questions
          </p>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, i) => {
              const answered = !!answers[q.id];
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={q.id}
                  id={`nav-q-${i + 1}`}
                  type="button"
                  onClick={() => scrollToQuestion(i)}
                  className={cn(
                    "relative aspect-square rounded-lg text-xs font-semibold transition",
                    isCurrent
                      ? "bg-accent text-white ring-2 ring-accent/30 shadow-sm"
                      : answered
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {i + 1}
                  {answered && isCurrent && (
                    <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300 ring-1 ring-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-emerald-100 ring-1 ring-emerald-200" />
              Answered ({answeredCount})
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded bg-slate-100 ring-1 ring-slate-200" />
              Skipped ({questions.length - answeredCount})
            </div>
          </div>
        </aside>

        <main className="flex flex-1 flex-col overflow-hidden">
          <div
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto scroll-smooth"
          >
            <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-8 sm:py-8">
              {questions.map((q, idx) => {
                const isAnswered = !!answers[q.id];
                const isCurrent = idx === currentIdx;

                return (
                  <div
                    key={q.id}
                    ref={(el) => {
                      questionRefs.current[idx] = el;
                    }}
                    id={`question-card-${idx + 1}`}
                    className="scroll-mt-6"
                  >
                    <Card
                      className={cn(
                        "transition-all duration-200",
                        isCurrent
                          ? "border-accent/40 shadow-md ring-1 ring-accent/20"
                          : "border-slate-200/80 shadow-sm hover:border-slate-300",
                      )}
                    >
                      <CardContent className="p-6 sm:p-8">
                        <div className="mb-6 flex flex-wrap items-center justify-between gap-2 border-b border-navy/5 pb-4">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={isAnswered ? "default" : "secondary"}
                              className={cn(
                                "transition-colors",
                                isAnswered
                                  ? "border-emerald-200 bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                  : "bg-slate-100 text-slate-700 hover:bg-slate-100",
                              )}
                            >
                              Q{idx + 1}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              Question {idx + 1} of {questions.length}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            {isAnswered ? (
                              <>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                  <Check size={12} className="text-emerald-600" />
                                  Answered
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setAnswers((prev) => ({ ...prev, [q.id]: null }))
                                  }
                                  className="text-xs text-slate-400 transition-colors hover:text-red-500"
                                  title="Clear your answer"
                                >
                                  Clear
                                </button>
                              </>
                            ) : (
                              <span className="text-xs text-slate-400">Not answered yet</span>
                            )}
                          </div>
                        </div>

                        {q.imageUrl ? (
                          <QuestionImageViewer
                            src={q.imageUrl}
                            alt={`Question ${idx + 1} illustration`}
                          />
                        ) : null}

                        <h2 className="text-lg font-semibold leading-relaxed text-navy sm:text-xl">
                          {q.prompt}
                        </h2>

                        <div className="mt-8 space-y-3">
                          {q.options.map((option, oi) => {
                            const isSelected = answers[q.id] === option.id;
                            const letter = String.fromCharCode(65 + oi);
                            return (
                              <button
                                key={option.id}
                                id={`q-${idx + 1}-option-${oi}`}
                                type="button"
                                onClick={() => selectAnswer(q.id, option.id)}
                                className={cn(
                                  "flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition duration-150 active:scale-[0.995]",
                                  isSelected
                                    ? "border-accent bg-accent/5 text-navy shadow-sm ring-1 ring-accent/30"
                                    : "border-slate-200 bg-white text-navy hover:border-accent/40 hover:bg-heroBg/50",
                                )}
                              >
                                <span
                                  className={cn(
                                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold transition-colors",
                                    isSelected
                                      ? "bg-accent text-white"
                                      : "bg-slate-100 text-slate-600",
                                  )}
                                >
                                  {isSelected ? <Check size={14} /> : letter}
                                </span>
                                <span className="pt-1 text-base leading-relaxed">
                                  {option.text}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}

              {/* End of Exam Card */}
              <div className="rounded-2xl border border-dashed border-navy/20 bg-white p-6 text-center shadow-sm sm:p-8">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent">
                  <Check size={24} />
                </div>
                <h3 className="text-lg font-bold text-navy">End of Questions</h3>
                <p className="mt-1 text-sm text-slate-600">
                  You have answered {answeredCount} of {questions.length} questions.
                </p>
                {questions.length - answeredCount > 0 ? (
                  <p className="mt-1 text-xs font-medium text-amber-600">
                    {questions.length - answeredCount} question
                    {questions.length - answeredCount > 1 ? "s" : ""} remaining unanswered
                  </p>
                ) : (
                  <p className="mt-1 text-xs font-medium text-emerald-600">
                    All questions answered! Ready to submit.
                  </p>
                )}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => scrollToQuestion(0)}
                  >
                    Review from Q1
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setConfirmSubmit(true)}
                    disabled={submitting}
                    className="gap-2"
                  >
                    <Send size={14} />
                    Submit Exam
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <footer className="shrink-0 border-t border-navy/10 bg-white px-4 py-4 sm:px-8">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
              <Button
                id="prev-question-btn"
                variant="outline"
                onClick={() => scrollToQuestion(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-navy">Q{currentIdx + 1}</span>
                <span>/</span>
                <span>{questions.length}</span>
                <span className="hidden sm:inline text-slate-400">· Scroll to navigate</span>
              </div>

              {currentIdx < questions.length - 1 ? (
                <Button
                  id="next-question-btn"
                  onClick={() =>
                    scrollToQuestion(Math.min(questions.length - 1, currentIdx + 1))
                  }
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              ) : (
                <Button
                  id="finish-exam-btn"
                  onClick={() => setConfirmSubmit(true)}
                  disabled={submitting}
                >
                  Finish Exam
                  <Send size={14} />
                </Button>
              )}
            </div>
          </footer>
        </main>
      </div>

      <Dialog
        open={confirmSubmit}
        onOpenChange={(nextOpen) => {
          if (!submitting) setConfirmSubmit(nextOpen);
        }}
      >
        <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
          <DialogHeader className="space-y-2 border-b border-navy/8 px-6 py-5 pr-14">
            <DialogTitle>Submit exam?</DialogTitle>
            <DialogDescription>
              Review your progress before sending your answers for grading.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Answered
                </p>
                <p className="mt-1 text-2xl font-bold text-navy">{answeredCount}</p>
              </div>
              <div
                className={cn(
                  "rounded-xl border px-4 py-3",
                  questions.length - answeredCount > 0
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-200 bg-slate-50",
                )}
              >
                <p
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide",
                    questions.length - answeredCount > 0
                      ? "text-amber-700"
                      : "text-slate-500",
                  )}
                >
                  Unanswered
                </p>
                <p className="mt-1 text-2xl font-bold text-navy">
                  {questions.length - answeredCount}
                </p>
              </div>
            </div>

            {questions.length - answeredCount > 0 ? (
              <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm leading-6 text-amber-950">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <p>
                  {questions.length - answeredCount === 1 ? (
                    <>
                      <strong className="font-semibold">1 question remains</strong> unanswered.
                      You can still submit, but it will score zero.
                    </>
                  ) : (
                    <>
                      <strong className="font-semibold">
                        {questions.length - answeredCount} questions remain
                      </strong>{" "}
                      unanswered. You can still submit, but they will score zero.
                    </>
                  )}
                </p>
              </div>
            ) : (
              <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm leading-6 text-emerald-900">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                <p>All questions are answered. You&apos;re ready to submit.</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 border-t border-navy/8 px-6 py-4 sm:justify-between">
            <Button
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => setConfirmSubmit(false)}
              disabled={submitting}
            >
              Keep working
            </Button>
            <Button
              id="confirm-submit-btn"
              className="w-full sm:w-auto"
              onClick={() => void handleSubmit()}
              disabled={submitting}
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {submitting ? "Submitting..." : "Submit exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
