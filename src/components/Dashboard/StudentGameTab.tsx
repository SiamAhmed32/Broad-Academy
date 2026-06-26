"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Flame,
  Gamepad2,
  LockKeyhole,
  Sparkles,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { TicTacToeBoard } from "@/components/games/TicTacToeBoard";
import type { GameOutcome } from "@/lib/games/tic-tac-toe";

type GameStats = {
  wins: number;
  losses: number;
  draws: number;
  gamesPlayed: number;
  winStreak: number;
  bestWinStreak: number;
  lastPlayedAt: string | null;
  enabled: boolean;
};

const defaultStats: GameStats = {
  wins: 0,
  losses: 0,
  draws: 0,
  gamesPlayed: 0,
  winStreak: 0,
  bestWinStreak: 0,
  lastPlayedAt: null,
  enabled: true,
};

type StudentGameTabProps = {
  hasEnrollment: boolean;
  firstName: string;
  onBrowseEnrollments: () => void;
};

export function StudentGameTab({
  hasEnrollment,
  firstName,
  onBrowseEnrollments,
}: StudentGameTabProps) {
  const reduceMotion = useReducedMotion();

  if (!hasEnrollment) {
    return (
      <LockedGameLounge firstName={firstName} onBrowseEnrollments={onBrowseEnrollments} />
    );
  }

  return <UnlockedGameLounge reduceMotion={reduceMotion} />;
}

function LockedGameLounge({
  firstName,
  onBrowseEnrollments,
}: {
  firstName: string;
  onBrowseEnrollments: () => void;
}) {
  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] border border-navy/8 bg-white p-8 shadow-[0_24px_80px_rgba(22,51,81,.08)] sm:p-12">
        <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-accent/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-12 -right-8 h-48 w-48 rounded-full bg-btnBg/15 blur-3xl" />

        <div className="relative mx-auto max-w-2xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-navy/5 text-navy"
          >
            <LockKeyhole className="h-8 w-8" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="mt-6 flex items-center justify-center gap-3"
          >
            {["X", "O", "X"].map((mark, index) => (
              <motion.span
                key={`${mark}-${index}`}
                animate={{ y: [0, -8, 0] }}
                transition={{
                  duration: 2.4,
                  repeat: Number.POSITIVE_INFINITY,
                  delay: index * 0.25,
                }}
                className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg font-black text-white shadow-lg ${
                  mark === "X" ? "bg-navy" : "bg-btnBg"
                }`}
              >
                {mark}
              </motion.span>
            ))}
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="mt-7 text-3xl font-semibold tracking-tight text-navy sm:text-4xl"
          >
            Brain Break Lounge is locked
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mt-4 text-sm leading-7 text-navy/60 sm:text-base"
          >
            Hey {firstName}, enroll in at least one course to unlock quick study-break
            games. It is our little reward for active learners — playful, short, and
            made to refresh your mind between lessons.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link
              href="/courses"
              className="inline-flex h-12 min-w-[200px] items-center justify-center gap-2 rounded-xl bg-navy px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              Browse courses <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              onClick={onBrowseEnrollments}
              className="inline-flex h-12 min-w-[200px] items-center justify-center gap-2 rounded-xl border border-navy/12 bg-white px-6 text-sm font-bold text-navy transition hover:bg-navy/5"
            >
              Check enrollment status
            </button>
          </motion.div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: Zap,
            title: "Quick reset",
            text: "Short games help you return to lessons with fresh focus.",
          },
          {
            icon: Trophy,
            title: "Track streaks",
            text: "Wins, draws, and personal bests are saved to your account.",
          },
          {
            icon: Sparkles,
            title: "Learners only",
            text: "Unlocked once your first course enrollment is active.",
          },
        ].map((item, index) => (
          <motion.div
            key={item.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 + index * 0.06 }}
            className="rounded-2xl border border-navy/8 bg-white p-5 shadow-sm"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
              <item.icon className="h-5 w-5" />
            </span>
            <p className="mt-4 font-semibold text-navy">{item.title}</p>
            <p className="mt-2 text-sm leading-6 text-navy/55">{item.text}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function UnlockedGameLounge({
  reduceMotion,
}: {
  reduceMotion: boolean | null;
}) {
  const sessionRef = useRef<string | null>(null);
  const [stats, setStats] = useState<GameStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const response = await fetch("/api/student/game/stats", { cache: "no-store" });
      const payload = await response.json();
      if (response.ok && payload.data) {
        setStats(payload.data as GameStats);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const startSession = useCallback(async () => {
    if (sessionRef.current) return;
    const response = await fetch("/api/student/game/session", { method: "POST" });
    const payload = await response.json();
    if (response.ok && payload.data?.sessionId) {
      sessionRef.current = payload.data.sessionId as string;
    }
  }, []);

  const submitResult = useCallback(async (outcome: GameOutcome, moves: number) => {
    if (!sessionRef.current) return;
    setSaving(true);
    try {
      const response = await fetch("/api/student/game/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionRef.current,
          outcome,
          moves,
        }),
      });
      const payload = await response.json();
      if (response.ok && payload.data) {
        setStats(payload.data as GameStats);
      }
    } finally {
      sessionRef.current = null;
      setSaving(false);
    }
  }, []);

  const winRate =
    stats.gamesPlayed > 0
      ? Math.round((stats.wins / stats.gamesPlayed) * 100)
      : 0;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-[2rem] bg-navy p-7 text-white shadow-2xl shadow-navy/15 sm:p-10">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.18)_1px,transparent_0)] [background-size:24px_24px]" />
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3.5 py-2 text-xs font-bold uppercase tracking-[0.16em] text-[#8cf0d0]">
              <Gamepad2 className="h-4 w-4" />
              Brain break lounge
            </span>
            <h1 className="mt-5 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">
              Play a quick round, then jump back in.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-white/65 sm:text-base">
              A short tic-tac-toe match against Academy Bot. Wins and streaks are
              saved securely to your student account.
            </p>
          </div>
          {saving ? (
            <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/75">
              Saving result...
            </span>
          ) : null}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatPill icon={Trophy} label="Wins" value={loading ? "—" : String(stats.wins)} tone="green" />
        <StatPill icon={Target} label="Win rate" value={loading ? "—" : `${winRate}%`} tone="blue" />
        <StatPill icon={Flame} label="Current streak" value={loading ? "—" : String(stats.winStreak)} tone="amber" />
        <StatPill icon={Sparkles} label="Best streak" value={loading ? "—" : String(stats.bestWinStreak)} tone="navy" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[2rem] border border-navy/8 bg-white p-5 shadow-[0_16px_45px_rgba(22,51,81,.07)] sm:p-7"
        >
          <TicTacToeBoard
            onGameStart={startSession}
            onGameEnd={submitResult}
            className="min-h-[360px]"
          />
        </motion.div>

        <div className="space-y-4">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-[1.75rem] border border-navy/8 bg-white p-6 shadow-sm"
          >
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent">
              Your scoreboard
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3 text-center">
              <ScoreBlock label="Played" value={stats.gamesPlayed} />
              <ScoreBlock label="Draws" value={stats.draws} />
              <ScoreBlock label="Losses" value={stats.losses} />
            </div>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-[1.75rem] border border-dashed border-accent/30 bg-[#f3fbf8] p-6"
          >
            <p className="font-semibold text-navy">Study-break tip</p>
            <p className="mt-2 text-sm leading-7 text-navy/60">
              Keep breaks under five minutes. A quick win (or a friendly loss) is
              enough — then return to your next lesson while the momentum is fresh.
            </p>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="rounded-[1.75rem] bg-[#f7f9fc] p-6 text-sm leading-7 text-navy/55"
          >
            Results are verified with a secure one-time session, so only enrolled
            students can save scores. Play fair, play light, and enjoy the lounge.
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function StatPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
  tone: "green" | "blue" | "amber" | "navy";
}) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-sky-50 text-sky-700",
    amber: "bg-amber-50 text-amber-700",
    navy: "bg-navy/5 text-navy",
  };

  return (
    <div className="rounded-2xl border border-navy/8 bg-white p-5 shadow-sm">
      <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${tones[tone]}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-navy/40">
        {label}
      </p>
      <p className="mt-1 text-2xl font-semibold text-navy">{value}</p>
    </div>
  );
}

function ScoreBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-[#f7f9fc] px-3 py-4">
      <p className="text-2xl font-semibold text-navy">{value}</p>
      <p className="mt-1 text-xs text-navy/45">{label}</p>
    </div>
  );
}
