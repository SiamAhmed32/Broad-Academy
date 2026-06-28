"use client";

import { AnimatePresence, motion } from "framer-motion";
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

  const currentQuestion = questions[currentIdx];
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
                  onClick={() => setCurrentIdx(i)}
                  className={cn(
                    "aspect-square rounded-lg text-xs font-semibold transition",
                    isCurrent
                      ? "bg-accent text-white ring-2 ring-accent/30"
                      : answered
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                  )}
                >
                  {i + 1}
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
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion?.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.2 }}
                className="mx-auto max-w-3xl px-4 py-6 sm:px-8 sm:py-8"
              >
                <Card>
                  <CardContent className="p-6 sm:p-8">
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">Q{currentIdx + 1}</Badge>
                      <span className="text-xs text-slate-500">
                        {answeredCount} of {questions.length} answered
                      </span>
                    </div>

                    {currentQuestion?.imageUrl ? (
                      <QuestionImageViewer
                        src={currentQuestion.imageUrl}
                        alt={`Question ${currentIdx + 1} illustration`}
                      />
                    ) : null}

                    <h2 className="text-lg font-semibold leading-relaxed text-navy sm:text-xl">
                      {currentQuestion?.prompt}
                    </h2>

                    <div className="mt-8 space-y-3">
                      {currentQuestion?.options.map((option, oi) => {
                        const isSelected = answers[currentQuestion.id] === option.id;
                        const letter = String.fromCharCode(65 + oi);
                        return (
                          <motion.button
                            key={option.id}
                            id={`option-${oi}`}
                            type="button"
                            whileHover={{ scale: 1.005 }}
                            whileTap={{ scale: 0.995 }}
                            onClick={() => selectAnswer(currentQuestion.id, option.id)}
                            className={cn(
                              "flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition",
                              isSelected
                                ? "border-accent bg-accent/5 text-navy"
                                : "border-slate-200 bg-white text-navy hover:border-accent/40 hover:bg-heroBg/50",
                            )}
                          >
                            <span
                              className={cn(
                                "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                                isSelected
                                  ? "bg-accent text-white"
                                  : "bg-slate-100 text-slate-600",
                              )}
                            >
                              {isSelected ? <Check size={14} /> : letter}
                            </span>
                            <span className="pt-1 text-base leading-relaxed">{option.text}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="shrink-0 border-t border-navy/10 bg-white px-4 py-4 sm:px-8">
            <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
              <Button
                id="prev-question-btn"
                variant="outline"
                onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                disabled={currentIdx === 0}
              >
                <ChevronLeft size={16} />
                Previous
              </Button>

              <span className="text-xs text-slate-500 lg:hidden">
                {currentIdx + 1} / {questions.length}
              </span>

              {currentIdx < questions.length - 1 ? (
                <Button
                  id="next-question-btn"
                  onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                >
                  Next
                  <ChevronRight size={16} />
                </Button>
              ) : (
                <Button id="finish-exam-btn" onClick={() => setConfirmSubmit(true)}>
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
