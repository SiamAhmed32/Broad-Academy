"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Award,
  Check,
  ChevronLeft,
  Clock,
  Loader2,
  Users,
  X,
  Minus,
  Trophy,
} from "lucide-react";

type Option = {
  id: string;
  text: string;
  isCorrect: boolean;
  displayOrder: number;
};

type Question = {
  id: string;
  prompt: string;
  imageUrl: string | null;
  explanation: string | null;
  displayOrder: number;
  options: Option[];
};

type AttemptData = {
  id: string;
  score: number;
  total: number;
  correctQty: number;
  wrongQty: number;
  skippedQty: number;
  timeTakenSec: number;
  answers: Record<string, string | null>;
  submittedAt: string;
};

type ResultData = {
  exam: { id: string; title: string; totalMarks: number; negativeMarking: number };
  attempt: AttemptData;
  questions: Question[];
  rank: number;
  totalParticipants: number;
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

export default function ExamResultClient({
  slug,
  attemptId,
}: {
  slug: string;
  attemptId: string;
}) {
  const [data, setData] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"overview" | "review">("overview");

  useEffect(() => {
    fetch(`/api/exams/${slug}/result/${attemptId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [slug, attemptId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Result not found.
      </div>
    );
  }

  const { exam, attempt, questions, rank, totalParticipants } = data;
  const percentage = Math.round((attempt.score / attempt.total) * 100);
  const passed = percentage >= 40;
  const marksPerQ = attempt.total / Math.max(questions.length, 1);
  const positiveScore = attempt.correctQty * marksPerQ;
  const negativeScore = attempt.wrongQty * exam.negativeMarking;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Result hero */}
      <div className="relative overflow-hidden bg-navy px-4 py-16">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(5,150,105,0.18),transparent_55%)]" />

        <div className="relative max-w-3xl mx-auto text-center">
          <Link
            href={`/exams/${slug}`}
            className="mb-8 inline-flex items-center gap-1 text-sm text-white/70 transition-colors hover:text-white"
          >
            <ChevronLeft size={14} />
            Back to Exam
          </Link>

          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <div
              className={`w-24 h-24 rounded-full mx-auto mb-6 flex items-center justify-center text-3xl font-extrabold border-4 ${
                passed
                  ? "border-accent bg-accent/15 text-emerald-100"
                  : "border-red-400 bg-red-500/15 text-red-100"
              }`}
            >
              {percentage}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-extrabold text-white mb-2">
              {passed ? "🎉 Well Done!" : "Keep Practicing!"}
            </h1>
            <p className="text-white/70 mb-2">{exam.title}</p>
            <div className="text-5xl font-extrabold text-white mb-1">
              {attempt.score}
              <span className="text-2xl text-white/45">/{attempt.total}</span>
            </div>
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-2xl mx-auto"
          >
            <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
              <div className="text-2xl font-bold text-emerald-400">{attempt.correctQty}</div>
              <div className="text-xs text-slate-400 mt-1">Correct</div>
            </div>
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-400">{attempt.wrongQty}</div>
              <div className="text-xs text-slate-400 mt-1">Wrong</div>
            </div>
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
              <div className="text-2xl font-bold text-slate-400">{attempt.skippedQty}</div>
              <div className="text-xs text-slate-400 mt-1">Skipped</div>
            </div>
            <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4">
              <Clock size={18} className="text-indigo-400 mx-auto mb-1" />
              <div className="text-lg font-bold text-indigo-400">{formatTime(attempt.timeTakenSec)}</div>
              <div className="text-xs text-slate-400">Time</div>
            </div>
          </motion.div>

          {/* Rank badge */}
          {totalParticipants > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-4 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-amber-900/20 border border-amber-500/30 text-amber-300"
            >
              <Trophy size={20} className="text-amber-400" />
              <span className="font-bold text-lg">Rank #{rank}</span>
              <span className="text-slate-400 text-sm">of {totalParticipants}</span>
            </motion.div>
          )}
        </div>
      </div>

      {/* Tab toggle */}
      <div className="sticky top-16 z-30 border-b border-slate-200 bg-white/90 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto px-4 flex">
          {(["overview", "review"] as const).map((v) => (
            <button
              key={v}
              id={`result-tab-${v}`}
              onClick={() => setView(v)}
              className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all capitalize ${
                view === v
                  ? "border-accent text-navy"
                  : "border-transparent text-slate-500 hover:text-navy"
              }`}
            >
              {v === "overview" ? "📊 Overview" : "📝 Review Answers"}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        {view === "overview" ? (
          <div className="space-y-4">
            {/* Score breakdown card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="font-bold text-navy mb-4">Score Breakdown</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Correct ({attempt.correctQty}) × {marksPerQ.toFixed(2)} marks</span>
                  <span className="text-accent font-semibold">+{positiveScore.toFixed(2)}</span>
                </div>
                {exam.negativeMarking > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">
                      Wrong ({attempt.wrongQty}) × {marksPerQ.toFixed(2)} × {exam.negativeMarking} (negative)
                    </span>
                    <span className="text-red-400 font-semibold">
                      -{negativeScore.toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                  <span className="text-navy font-semibold">Final Score</span>
                  <span className="text-2xl font-extrabold text-accent">{attempt.score}</span>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href={`/exams/${slug}/leaderboard`}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-200 bg-white text-navy text-sm font-semibold transition-colors hover:bg-slate-50"
              >
                <Users size={16} /> View Leaderboard
              </Link>
              <button
                onClick={() => setView("review")}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-accent text-white text-sm font-semibold transition-colors hover:bg-accent/90"
              >
                <Award size={16} /> Review My Answers
              </button>
            </div>
          </div>
        ) : (
          /* Answer review */
          <div className="space-y-6">
            {questions.map((q, qi) => {
              const givenAnswerId = attempt.answers[q.id] ?? null;
              const givenOption = q.options.find((o) => o.id === givenAnswerId);
              const isCorrect = givenOption?.isCorrect === true;
              const isSkipped = !givenAnswerId;

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(qi * 0.05, 1) }}
                  className={`rounded-2xl border p-5 space-y-4 ${
                    isSkipped
                      ? "border-slate-600/50 bg-white/3"
                      : isCorrect
                        ? "border-emerald-500/40 bg-emerald-900/10"
                        : "border-red-500/40 bg-red-900/10"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        isSkipped
                          ? "bg-slate-700 text-slate-400"
                          : isCorrect
                            ? "bg-emerald-600 text-white"
                            : "bg-red-600 text-white"
                      }`}
                    >
                      {isSkipped ? (
                        <Minus size={14} />
                      ) : isCorrect ? (
                        <Check size={14} />
                      ) : (
                        <X size={14} />
                      )}
                    </span>
                    <p className="text-white font-medium leading-relaxed flex-1">{q.prompt}</p>
                  </div>

                  {q.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={q.imageUrl}
                      alt="Question"
                      className="rounded-xl max-h-48 object-contain bg-black/40"
                    />
                  )}

                  <div className="space-y-2 ml-11">
                    {q.options.map((opt) => {
                      const isGiven = opt.id === givenAnswerId;
                      const isRight = opt.isCorrect;
                      return (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                            isRight
                              ? "bg-emerald-900/30 border border-emerald-500/40 text-emerald-300"
                              : isGiven && !isRight
                                ? "bg-red-900/30 border border-red-500/40 text-red-300"
                                : "text-slate-400"
                          }`}
                        >
                          {isRight ? (
                            <Check size={13} className="text-emerald-400 flex-shrink-0" />
                          ) : isGiven ? (
                            <X size={13} className="text-red-400 flex-shrink-0" />
                          ) : (
                            <span className="w-3 flex-shrink-0" />
                          )}
                          <span className="flex-1">{opt.text}</span>
                          {isGiven && !isRight && (
                            <span className="ml-auto text-xs text-red-400 whitespace-nowrap">Your answer</span>
                          )}
                          {isRight && (
                            <span className="ml-auto text-xs text-emerald-400 whitespace-nowrap">Correct</span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="ml-11 bg-indigo-900/20 border border-indigo-500/30 rounded-lg p-3 text-sm text-indigo-200">
                      <span className="text-indigo-400 font-semibold text-xs uppercase tracking-wide block mb-1">
                        Explanation
                      </span>
                      {q.explanation}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
