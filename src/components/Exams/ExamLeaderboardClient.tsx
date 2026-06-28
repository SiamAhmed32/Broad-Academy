"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clock,
  Crown,
  Loader2,
  Medal,
  Minus,
  Trophy,
  X,
} from "lucide-react";

import Container from "@/components/reusables/Container";
import { cn } from "@/lib/utils";

type LeaderboardEntry = {
  rank: number;
  userId: string;
  fullName: string;
  score: number;
  total: number;
  correctQty: number;
  wrongQty: number;
  skippedQty: number;
  timeTakenSec: number;
  submittedAt: string;
  attemptId: string;
};

type LeaderboardData = {
  exam: { id: string; title: string; totalMarks: number };
  leaderboard: LeaderboardEntry[];
};

function formatTime(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={18} className="text-amber-500" />;
  if (rank === 2) return <Medal size={18} className="text-slate-400" />;
  if (rank === 3) return <Medal size={18} className="text-amber-700" />;
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-heroBg text-xs font-bold text-navy">
      {rank}
    </span>
  );
}

export default function ExamLeaderboardClient({ slug }: { slug: string }) {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/exams/${slug}/leaderboard`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f6f8fb]">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center bg-[#f6f8fb] text-navy/50">
        Leaderboard not available.
      </div>
    );
  }

  const { exam, leaderboard } = data;
  const top3 = leaderboard.slice(0, 3);

  return (
    <main className="overflow-hidden bg-[#f6f8fb] pb-20">
      <section className="relative bg-navy pb-24 pt-7 text-white sm:pb-28 sm:pt-10">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.22)_1px,transparent_0)] [background-size:32px_32px]" />
        <div className="absolute -right-20 top-8 h-80 w-80 rounded-full bg-btnBg/20 blur-3xl" />
        <div className="absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />

        <Container className="relative text-center">
          <Link
            href={`/exams/${slug}`}
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to exam
          </Link>

          <motion.div
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-10"
          >
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Trophy size={28} className="text-amber-400" />
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
              Leaderboard
            </h1>
            <p className="mt-3 text-base text-white/68">{exam.title}</p>
            <span className="mt-5 inline-flex rounded-full border border-white/15 bg-white/8 px-4 py-1.5 text-xs font-bold text-white/78">
              {leaderboard.length} participant{leaderboard.length !== 1 ? "s" : ""}
            </span>
          </motion.div>
        </Container>
      </section>

      <Container className="relative -mt-14">
        {top3.length >= 1 ? (
          <div className="flex items-end justify-center gap-3 sm:gap-4">
            {top3[1] ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="w-full max-w-[140px] text-center"
              >
                <div className="overflow-hidden rounded-[1.5rem] border border-navy/10 bg-white shadow-[0_14px_45px_rgba(22,51,81,.08)]">
                  <div className="p-4">
                    <Medal size={22} className="mx-auto text-slate-400" />
                    <p className="mt-2 truncate text-sm font-semibold text-navy">
                      {top3[1].fullName}
                    </p>
                    <p className="mt-1 text-xl font-bold text-navy">{top3[1].score}</p>
                    <p className="text-xs text-navy/45">{formatTime(top3[1].timeTakenSec)}</p>
                  </div>
                  <div className="flex h-14 items-center justify-center bg-heroBg text-2xl font-black text-navy/50">
                    2
                  </div>
                </div>
              </motion.div>
            ) : null}

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="w-full max-w-[160px] text-center"
            >
              <div className="overflow-hidden rounded-[1.5rem] border border-amber-200 bg-white shadow-[0_20px_55px_rgba(22,51,81,.12)]">
                <div className="bg-gradient-to-b from-amber-50 to-white p-5">
                  <Crown size={26} className="mx-auto text-amber-500" />
                  <p className="mt-2 truncate text-sm font-semibold text-navy">
                    {top3[0].fullName}
                  </p>
                  <p className="mt-1 text-2xl font-bold text-accent">{top3[0].score}</p>
                  <p className="text-xs text-navy/45">{formatTime(top3[0].timeTakenSec)}</p>
                </div>
                <div className="flex h-20 items-center justify-center bg-accent text-3xl font-black text-white">
                  1
                </div>
              </div>
            </motion.div>

            {top3[2] ? (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="w-full max-w-[140px] text-center"
              >
                <div className="overflow-hidden rounded-[1.5rem] border border-navy/10 bg-white shadow-[0_14px_45px_rgba(22,51,81,.08)]">
                  <div className="p-4">
                    <Medal size={20} className="mx-auto text-amber-700" />
                    <p className="mt-2 truncate text-sm font-semibold text-navy">
                      {top3[2].fullName}
                    </p>
                    <p className="mt-1 text-xl font-bold text-navy">{top3[2].score}</p>
                    <p className="text-xs text-navy/45">{formatTime(top3[2].timeTakenSec)}</p>
                  </div>
                  <div className="flex h-10 items-center justify-center bg-amber-50 text-xl font-black text-amber-700">
                    3
                  </div>
                </div>
              </motion.div>
            ) : null}
          </div>
        ) : null}

        <motion.section
          initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className={cn(
            "rounded-[1.8rem] border border-navy/10 bg-white p-4 shadow-[0_14px_45px_rgba(22,51,81,.06)] sm:p-6",
            top3.length >= 1 ? "mt-8" : "mt-0",
          )}
        >
          {leaderboard.length === 0 ? (
            <p className="py-12 text-center text-navy/50">No participants yet.</p>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, i) => (
                <motion.div
                  key={entry.attemptId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.8) }}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border p-4 transition",
                    entry.rank <= 3
                      ? "border-amber-100 bg-amber-50/40"
                      : "border-navy/8 bg-[#fafcfe] hover:border-accent/20 hover:bg-white",
                  )}
                >
                  <div className="flex w-8 shrink-0 justify-center">
                    <RankBadge rank={entry.rank} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-navy">
                      {entry.fullName}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-navy/45">
                      <span className="inline-flex items-center gap-1">
                        <Check size={11} className="text-emerald-600" />
                        {entry.correctQty}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <X size={11} className="text-red-500" />
                        {entry.wrongQty}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Minus size={11} />
                        {entry.skippedQty}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} />
                        {formatTime(entry.timeTakenSec)}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-navy">{entry.score}</p>
                    <p className="text-xs text-navy/45">/{entry.total}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </Container>
    </main>
  );
}
