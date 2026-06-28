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
  Minus,
  Trophy,
  Users,
  X,
} from "lucide-react";

import Container from "@/components/reusables/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

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
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f6f8fb]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f6f8fb] text-slate-500">
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
    <div className="min-h-screen bg-[#f6f8fb]">
      <div className="relative overflow-hidden bg-navy px-4 py-14 sm:py-16">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(5,150,105,0.2),transparent_55%)]" />

        <Container className="relative text-center">
          <Link
            href={`/exams/${slug}`}
            className="mb-8 inline-flex items-center gap-1 text-sm text-white/70 transition hover:text-white"
          >
            <ChevronLeft size={14} />
            Back to Exam
          </Link>

          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <div
              className={cn(
                "mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-4 text-3xl font-extrabold",
                passed
                  ? "border-accent bg-accent/15 text-emerald-100"
                  : "border-red-400 bg-red-500/15 text-red-100",
              )}
            >
              {percentage}%
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <h1 className="mb-2 text-3xl font-extrabold text-white sm:text-4xl">
              {passed ? "Well Done!" : "Keep Practicing!"}
            </h1>
            <p className="mb-2 text-white/70">{exam.title}</p>
            <div className="mb-1 text-5xl font-extrabold text-white">
              {attempt.score}
              <span className="text-2xl text-white/45">/{attempt.total}</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mx-auto mt-8 grid max-w-2xl grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {[
              { label: "Correct", value: attempt.correctQty, tone: "emerald" },
              { label: "Wrong", value: attempt.wrongQty, tone: "red" },
              { label: "Skipped", value: attempt.skippedQty, tone: "slate" },
              { label: "Time", value: formatTime(attempt.timeTakenSec), tone: "accent", icon: Clock },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
              >
                {stat.icon ? (
                  <stat.icon size={18} className="mx-auto mb-1 text-accent" />
                ) : null}
                <div className="text-xl font-bold text-white sm:text-2xl">{stat.value}</div>
                <div className="mt-1 text-xs text-white/60">{stat.label}</div>
              </div>
            ))}
          </motion.div>

          {totalParticipants > 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-6 py-3 text-amber-200"
            >
              <Trophy size={20} className="text-amber-400" />
              <span className="text-lg font-bold">Rank #{rank}</span>
              <span className="text-sm text-white/60">of {totalParticipants}</span>
            </motion.div>
          ) : null}
        </Container>
      </div>

      <div className="sticky top-16 z-30 border-b border-navy/10 bg-white/95 backdrop-blur-md">
        <Container>
          <div className="flex">
            {(["overview", "review"] as const).map((v) => (
              <button
                key={v}
                id={`result-tab-${v}`}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "border-b-2 px-6 py-4 text-sm font-semibold capitalize transition",
                  view === v
                    ? "border-accent text-navy"
                    : "border-transparent text-slate-500 hover:text-navy",
                )}
              >
                {v === "overview" ? "Overview" : "Review Answers"}
              </button>
            ))}
          </div>
        </Container>
      </div>

      <Container className="py-10">
        {view === "overview" ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-2xl space-y-4"
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">
                    Correct ({attempt.correctQty}) × {marksPerQ.toFixed(2)} marks
                  </span>
                  <span className="font-semibold text-accent">+{positiveScore.toFixed(2)}</span>
                </div>
                {exam.negativeMarking > 0 ? (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">
                      Wrong ({attempt.wrongQty}) × {exam.negativeMarking} negative mark
                    </span>
                    <span className="font-semibold text-red-600">−{negativeScore.toFixed(2)}</span>
                  </div>
                ) : null}
                <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                  <span className="font-semibold text-navy">Final Score</span>
                  <span className="text-2xl font-extrabold text-accent">{attempt.score}</span>
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href={`/exams/${slug}/leaderboard`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy shadow-sm transition hover:bg-slate-50"
              >
                <Users size={16} />
                View Leaderboard
              </Link>
              <Button className="flex-1" onClick={() => setView("review")}>
                <Award size={16} />
                Review My Answers
              </Button>
            </div>
          </motion.div>
        ) : (
          <div className="mx-auto max-w-3xl space-y-5">
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
                  transition={{ delay: Math.min(qi * 0.04, 0.8) }}
                >
                  <Card
                    className={cn(
                      isSkipped
                        ? ""
                        : isCorrect
                          ? "border-emerald-200 bg-emerald-50/30"
                          : "border-red-200 bg-red-50/30",
                    )}
                  >
                    <CardContent className="space-y-4 p-5 sm:p-6">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
                            isSkipped
                              ? "bg-slate-100 text-slate-500"
                              : isCorrect
                                ? "bg-accent text-white"
                                : "bg-red-600 text-white",
                          )}
                        >
                          {isSkipped ? (
                            <Minus size={14} />
                          ) : isCorrect ? (
                            <Check size={14} />
                          ) : (
                            <X size={14} />
                          )}
                        </span>
                        <p className="flex-1 font-medium leading-relaxed text-navy">{q.prompt}</p>
                      </div>

                      {q.imageUrl ? (
                        <div className="ml-11 overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={q.imageUrl}
                            alt="Question"
                            className="max-h-48 w-full object-contain"
                          />
                        </div>
                      ) : null}

                      <div className="ml-11 space-y-2">
                        {q.options.map((opt) => {
                          const isGiven = opt.id === givenAnswerId;
                          const isRight = opt.isCorrect;
                          return (
                            <div
                              key={opt.id}
                              className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                                isRight
                                  ? "border border-emerald-200 bg-emerald-50 text-emerald-800"
                                  : isGiven && !isRight
                                    ? "border border-red-200 bg-red-50 text-red-700"
                                    : "text-slate-600",
                              )}
                            >
                              {isRight ? (
                                <Check size={13} className="shrink-0 text-accent" />
                              ) : isGiven ? (
                                <X size={13} className="shrink-0 text-red-600" />
                              ) : (
                                <span className="w-3 shrink-0" />
                              )}
                              <span className="flex-1">{opt.text}</span>
                              {isGiven && !isRight ? (
                                <span className="ml-auto whitespace-nowrap rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                                  Your answer
                                </span>
                              ) : null}
                              {isRight ? (
                                <Badge variant="success" className="ml-auto text-xs">
                                  Correct
                                </Badge>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation ? (
                        <div className="ml-11 rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">
                          <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-accent">
                            Explanation
                          </span>
                          {q.explanation}
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
