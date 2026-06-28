"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FileQuestion, Lock, Users, Zap } from "lucide-react";

import ExamCard from "@/components/Exams/ExamCard";
import type { ExamCardData } from "@/components/Exams/ExamCard";
import { Container } from "@/components/reusables";

type ExamsData = {
  freeExams: ExamCardData[];
  paidExams: ExamCardData[];
};

export default function ExamsPageClient({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const [data, setData] = useState<ExamsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"free" | "paid">("free");

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const freeExams = data?.freeExams ?? [];
  const paidExams = data?.paidExams ?? [];
  const activeExams = activeTab === "free" ? freeExams : paidExams;

  const examTabs = [
    {
      key: "free" as const,
      label: "Free Exams",
      description: "Free for registered students",
      count: freeExams.length,
      icon: Zap,
    },
    {
      key: "paid" as const,
      label: "Premium Exams",
      description: "Paid verified access",
      count: paidExams.length,
      icon: Lock,
    },
  ];

  return (
    <div className="min-h-screen bg-[#f6f8fb]">
      {/* Hero */}
      <section className="relative overflow-hidden bg-navy py-20 text-soft sm:py-24">
        <div className="pointer-events-none absolute left-[-5rem] top-0 h-72 w-72 rounded-full bg-accent/20 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-[-4rem] h-80 w-80 rounded-full bg-btnBg/15 blur-3xl" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.1),transparent_40%)]" />

        <Container className="relative text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-accent">
              <Zap className="h-3.5 w-3.5" />
              Exam Arena
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-[-0.04em] sm:text-5xl lg:text-6xl">
              Compete. Rank.{" "}
              <span className="text-accent">Improve.</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-soft/75 sm:text-lg">
              Join live MCQ competitions, track your score, and climb the
              leaderboard with Broad Academy exams.
            </p>
          </motion.div>
        </Container>
      </section>

      {/* Tabs */}
      <Container className="relative z-10 -mt-8">
        <div className="grid gap-2 rounded-2xl border border-navy/10 bg-white p-2 shadow-xl shadow-navy/10 sm:grid-cols-2">
          {examTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;

            return (
              <button
                key={tab.key}
                type="button"
                id={`exam-tab-${tab.key}`}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center justify-between gap-4 rounded-xl px-4 py-4 text-left transition-all ${
                  isActive
                    ? "bg-navy text-soft shadow-lg shadow-navy/20"
                    : "bg-heroBg text-navy/70 hover:bg-white"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                      isActive ? "bg-white/10 text-accent" : "bg-white text-navy/50"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{tab.label}</span>
                    <span
                      className={`mt-0.5 block text-xs ${
                        isActive ? "text-soft/65" : "text-navy/50"
                      }`}
                    >
                      {tab.description}
                    </span>
                  </span>
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    isActive ? "bg-accent text-white" : "bg-white text-navy"
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </Container>

      {/* Grid */}
      <Container className="py-12 sm:py-14">
        {loading ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[420px] animate-pulse rounded-[1.75rem] border border-navy/8 bg-white"
              />
            ))}
          </div>
        ) : activeExams.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-navy/15 bg-white py-20 text-center">
            <FileQuestion className="mx-auto h-12 w-12 text-navy/25" />
            <h3 className="mt-4 text-xl font-semibold text-navy">
              No {activeTab === "free" ? "free" : "premium"} exams yet
            </h3>
            <p className="mt-2 text-navy/60">Check back soon for new competitions.</p>
          </div>
        ) : (
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3"
          >
            {activeExams.map((exam, index) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                isFree={activeTab === "free"}
                isAuthenticated={isAuthenticated}
                index={index}
              />
            ))}
          </motion.div>
        )}

        {!loading && !isAuthenticated ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="relative mt-14 overflow-hidden rounded-3xl border border-navy/10 bg-navy p-8 text-center sm:p-12"
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(5,150,105,0.18),transparent_55%)]" />
            <div className="relative">
              <Users className="mx-auto h-8 w-8 text-accent" />
              <h3 className="mt-4 text-2xl font-semibold text-soft">
                Sign in to participate
              </h3>
              <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-soft/70">
                Create a free account to join exams, save your scores, and appear
                on the leaderboard.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link
                  href="/login"
                  className="inline-flex h-11 items-center rounded-xl border border-white/20 bg-white/10 px-6 text-sm font-semibold text-soft transition hover:bg-white/15"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="inline-flex h-11 items-center rounded-xl bg-accent px-6 text-sm font-semibold text-white transition hover:bg-accent/90"
                >
                  Get started
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </Container>
    </div>
  );
}
