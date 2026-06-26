"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Check,
  ChevronLeft,
  Clock,
  Crown,
  Loader2,
  Medal,
  Minus,
  Trophy,
  X,
} from "lucide-react";

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

function RankIcon({ rank }: { rank: number }) {
  if (rank === 1) return <Crown size={20} className="text-amber-400" />;
  if (rank === 2) return <Medal size={18} className="text-slate-300" />;
  if (rank === 3) return <Medal size={18} className="text-amber-700" />;
  return (
    <span className="text-slate-500 font-bold text-sm w-5 text-center">
      #{rank}
    </span>
  );
}

export default function ExamLeaderboardClient({ slug }: { slug: string }) {
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 size={32} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-400">
        Leaderboard not available.
      </div>
    );
  }

  const { exam, leaderboard } = data;
  const top3 = leaderboard.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="relative py-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-950/30 via-slate-950 to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(245,158,11,0.1),transparent)]" />
        <div className="relative max-w-4xl mx-auto text-center">
          <Link
            href={`/exams/${slug}`}
            className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-6 transition-colors"
          >
            <ChevronLeft size={14} /> Back to Exam
          </Link>
          <div className="w-16 h-16 rounded-full bg-amber-900/30 border-2 border-amber-500/50 flex items-center justify-center mx-auto mb-4">
            <Trophy size={28} className="text-amber-400" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
            Leaderboard
          </h1>
          <p className="text-slate-400">{exam.title}</p>
          <p className="text-slate-500 text-sm mt-1">
            {leaderboard.length} participant{leaderboard.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 pb-16">
        {/* Podium – top 3 */}
        {top3.length >= 1 && (
          <div className="flex items-end justify-center gap-3 mb-10">
            {/* 2nd place */}
            {top3[1] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex-1 max-w-36 text-center"
              >
                <div className="bg-slate-800/80 border border-slate-600/50 rounded-t-2xl pt-6 pb-4 px-3">
                  <Medal size={24} className="text-slate-300 mx-auto mb-2" />
                  <div className="text-sm font-bold text-white truncate">
                    {top3[1].fullName}
                  </div>
                  <div className="text-xl font-extrabold text-white mt-1">
                    {top3[1].score}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatTime(top3[1].timeTakenSec)}
                  </div>
                </div>
                <div className="h-16 bg-slate-700/50 border-x border-b border-slate-600/50 flex items-center justify-center text-2xl font-black text-slate-400 rounded-b-xl">
                  2
                </div>
              </motion.div>
            )}

            {/* 1st place */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 max-w-44 text-center"
            >
              <div className="bg-gradient-to-b from-amber-900/50 to-amber-900/20 border border-amber-500/50 rounded-t-2xl pt-8 pb-4 px-3">
                <Crown size={28} className="text-amber-400 mx-auto mb-2" />
                <div className="text-sm font-bold text-white truncate">
                  {top3[0].fullName}
                </div>
                <div className="text-2xl font-extrabold text-amber-400 mt-1">
                  {top3[0].score}
                </div>
                <div className="text-xs text-slate-400">
                  {formatTime(top3[0].timeTakenSec)}
                </div>
              </div>
              <div className="h-24 bg-amber-900/30 border-x border-b border-amber-500/40 flex items-center justify-center text-3xl font-black text-amber-400 rounded-b-xl">
                1
              </div>
            </motion.div>

            {/* 3rd place */}
            {top3[2] && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex-1 max-w-36 text-center"
              >
                <div className="bg-slate-800/80 border border-amber-800/40 rounded-t-2xl pt-5 pb-4 px-3">
                  <Medal size={22} className="text-amber-700 mx-auto mb-2" />
                  <div className="text-sm font-bold text-white truncate">
                    {top3[2].fullName}
                  </div>
                  <div className="text-xl font-extrabold text-white mt-1">
                    {top3[2].score}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatTime(top3[2].timeTakenSec)}
                  </div>
                </div>
                <div className="h-10 bg-amber-900/20 border-x border-b border-amber-800/30 flex items-center justify-center text-xl font-black text-amber-700 rounded-b-xl">
                  3
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Full leaderboard list */}
        {leaderboard.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No participants yet.
          </div>
        ) : (
          <div className="space-y-2">
            {leaderboard.map((entry, i) => (
              <motion.div
                key={entry.attemptId}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 1) }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  entry.rank <= 3
                    ? "border-amber-500/20 bg-amber-900/10"
                    : "border-white/10 bg-white/3 hover:bg-white/5"
                }`}
              >
                <div className="w-8 flex justify-center flex-shrink-0">
                  <RankIcon rank={entry.rank} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {entry.fullName}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="flex items-center gap-1">
                      <Check size={11} className="text-emerald-400" />
                      {entry.correctQty}
                    </span>
                    <span className="flex items-center gap-1">
                      <X size={11} className="text-red-400" />
                      {entry.wrongQty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Minus size={11} className="text-slate-500" />
                      {entry.skippedQty}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {formatTime(entry.timeTakenSec)}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-lg font-bold text-white">{entry.score}</div>
                  <div className="text-xs text-slate-500">/{entry.total}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
