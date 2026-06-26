"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Check,
  Loader2,
  Send,
  X,
} from "lucide-react";

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

  // Countdown timer
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

  // Auto-submit when time is up
  useEffect(() => {
    if (autoSubmit) {
      handleSubmit(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoSubmit]);

  const handleSubmit = useCallback(async (forced = false) => {
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
    }
  }, [answers, slug, router, submitting]);

  function selectAnswer(questionId: string, optionId: string) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: prev[questionId] === optionId ? null : optionId,
    }));
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Cannot Start Exam</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button onClick={() => router.back()} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const progress = (currentIdx / Math.max(questions.length - 1, 1)) * 100;
  const isWarningTime = timeLeft <= 120; // 2 min warning
  const isDangerTime = timeLeft <= 30;

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 h-16 border-b border-white/10 bg-slate-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-400 hidden sm:block">
            Question <span className="text-white font-semibold">{currentIdx + 1}</span> of <span className="text-white font-semibold">{questions.length}</span>
          </div>
          <div className="text-xs text-slate-500 hidden sm:block">
            {answeredCount}/{questions.length} answered
          </div>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono font-bold text-lg transition-all ${
          isDangerTime ? "bg-red-900/50 text-red-300 border border-red-500/50 animate-pulse" :
          isWarningTime ? "bg-amber-900/40 text-amber-300 border border-amber-500/40" :
          "bg-white/5 text-white border border-white/10"
        }`}>
          <Clock size={16} className={isDangerTime ? "text-red-400" : isWarningTime ? "text-amber-400" : "text-indigo-400"} />
          {formatCountdown(timeLeft)}
        </div>

        <button
          id="exam-submit-btn"
          onClick={() => setConfirmSubmit(true)}
          disabled={submitting}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {submitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
          <span className="hidden sm:inline">Submit</span>
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 h-1 bg-white/10">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-violet-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Question navigator sidebar */}
        <div className="hidden lg:flex flex-col w-64 border-r border-white/10 bg-slate-900/50 overflow-y-auto p-4">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-3 font-semibold">Questions</div>
          <div className="grid grid-cols-5 gap-1.5">
            {questions.map((q, i) => {
              const answered = !!answers[q.id];
              const isCurrent = i === currentIdx;
              return (
                <button
                  key={q.id}
                  id={`nav-q-${i + 1}`}
                  onClick={() => setCurrentIdx(i)}
                  className={`aspect-square rounded-lg text-xs font-semibold transition-all ${
                    isCurrent ? "bg-indigo-600 text-white ring-2 ring-indigo-400" :
                    answered ? "bg-emerald-600/80 text-white" :
                    "bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>
          <div className="mt-4 space-y-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-600/80" />
              Answered ({answeredCount})
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-white/5" />
              Skipped ({questions.length - answeredCount})
            </div>
          </div>
        </div>

        {/* Question area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuestion?.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="max-w-3xl mx-auto px-4 sm:px-8 py-8"
              >
                {/* Question number */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="flex-shrink-0 w-9 h-9 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-sm font-bold text-indigo-300">
                    {currentIdx + 1}
                  </span>
                  <div className="text-xs text-slate-500">
                    {answeredCount} of {questions.length} answered
                  </div>
                </div>

                {/* Question image */}
                {currentQuestion?.imageUrl && (
                  <div className="mb-6 rounded-xl overflow-hidden border border-white/10">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={currentQuestion.imageUrl}
                      alt="Question"
                      className="w-full max-h-64 object-contain bg-black/50"
                    />
                  </div>
                )}

                {/* Question prompt */}
                <div className="text-lg sm:text-xl font-semibold text-white leading-relaxed mb-8">
                  {currentQuestion?.prompt}
                </div>

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion?.options.map((option, oi) => {
                    const isSelected = answers[currentQuestion.id] === option.id;
                    const letter = String.fromCharCode(65 + oi); // A, B, C, D
                    return (
                      <motion.button
                        key={option.id}
                        id={`option-${oi}`}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => selectAnswer(currentQuestion.id, option.id)}
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
                          isSelected
                            ? "border-indigo-500 bg-indigo-900/30 text-white"
                            : "border-white/10 bg-white/3 text-slate-200 hover:border-indigo-500/40 hover:bg-white/8"
                        }`}
                      >
                        <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold transition-all ${
                          isSelected ? "bg-indigo-600 text-white" : "bg-white/10 text-slate-400"
                        }`}>
                          {isSelected ? <Check size={14} /> : letter}
                        </span>
                        <span className="text-base leading-relaxed pt-0.5">{option.text}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom navigation */}
          <div className="flex-shrink-0 border-t border-white/10 bg-slate-900/80 backdrop-blur-sm px-4 sm:px-8 py-4 flex items-center justify-between">
            <button
              id="prev-question-btn"
              onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
              disabled={currentIdx === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} />
              Previous
            </button>

            <div className="lg:hidden text-xs text-slate-500">
              {currentIdx + 1} / {questions.length}
            </div>

            {currentIdx < questions.length - 1 ? (
              <button
                id="next-question-btn"
                onClick={() => setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
              >
                Next
                <ChevronRight size={16} />
              </button>
            ) : (
              <button
                id="finish-exam-btn"
                onClick={() => setConfirmSubmit(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-sm font-semibold transition-all"
              >
                Finish Exam
                <Send size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirm submit dialog */}
      <AnimatePresence>
        {confirmSubmit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="text-center mb-5">
                <div className="w-14 h-14 rounded-full bg-amber-900/30 border border-amber-500/40 flex items-center justify-center mx-auto mb-3">
                  <Send size={24} className="text-amber-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Submit Exam?</h3>
                <p className="text-slate-400 text-sm">
                  You&apos;ve answered <strong className="text-white">{answeredCount}</strong> of{" "}
                  <strong className="text-white">{questions.length}</strong> questions.
                </p>
                {questions.length - answeredCount > 0 && (
                  <p className="text-amber-400 text-sm mt-1">
                    {questions.length - answeredCount} question{questions.length - answeredCount !== 1 ? "s" : ""} unanswered
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmSubmit(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium transition-colors"
                >
                  Continue
                </button>
                <button
                  id="confirm-submit-btn"
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  {submitting ? "Submitting..." : "Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
