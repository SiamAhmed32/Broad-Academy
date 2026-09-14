"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FileQuestion, Users } from "lucide-react";

import ExamCard from "@/components/Exams/ExamCard";
import type { ExamCardData } from "@/components/Exams/ExamCard";
import { Container, SectionHeading } from "@/components/reusables";
import {
  EXAM_CLASS_CATEGORIES,
  examMatchesClass,
} from "@/lib/exams/class-filters";
import { cn } from "@/lib/utils";

type FilterTone = "navy" | "free";

type ExamFilter = {
  key: string;
  label: string;
  count: number;
  tone: FilterTone;
  match: (exam: ExamCardData) => boolean;
};

const toneClasses: Record<FilterTone, { active: string; idle: string }> = {
  navy: {
    active:
      "border-navy bg-navy text-white shadow-[0_10px_24px_rgba(22,51,81,0.2)]",
    idle: "border-navy/10 bg-white text-navy hover:border-navy/25 hover:bg-navy/5",
  },
  free: {
    active:
      "border-[#146c43] bg-[#146c43] text-white shadow-[0_10px_24px_rgba(20,108,67,0.25)]",
    idle: "border-[#146c43]/25 bg-white text-[#146c43] hover:bg-[#146c43]/5",
  },
};

const isFreeExam = (exam: ExamCardData) => exam.price === 0;

export default function ExamsPageClient({
  isAuthenticated,
}: {
  isAuthenticated: boolean;
}) {
  const [exams, setExams] = useState<ExamCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetch("/api/exams")
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setExams(res.data.exams ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const filters = useMemo<ExamFilter[]>(() => {
    const classFilters = EXAM_CLASS_CATEGORIES.map((category) => ({
      key: category.key,
      label: category.label,
      count: exams.filter((exam) =>
        examMatchesClass(exam.code, category.key, exam.title),
      ).length,
      tone: "navy" as const,
      match: (exam: ExamCardData) =>
        examMatchesClass(exam.code, category.key, exam.title),
    }));

    return [
      {
        key: "all",
        label: "সব এক্সাম",
        count: exams.length,
        tone: "navy",
        match: () => true,
      },
      {
        key: "free",
        label: "Free",
        count: exams.filter(isFreeExam).length,
        tone: "free",
        match: isFreeExam,
      },
      ...classFilters,
    ];
  }, [exams]);

  const activeExams = useMemo(() => {
    const filter = filters.find((item) => item.key === activeFilter);
    return filter ? exams.filter(filter.match) : exams;
  }, [activeFilter, exams, filters]);

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Container className="pb-16 pt-12 sm:pb-20 sm:pt-14">
        <SectionHeading title="আমাদের এক্সাম ব্যাচসমূহ" />

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          {filters.map((filter) => {
            const active = activeFilter === filter.key;
            const tone = toneClasses[filter.tone];

            return (
              <button
                key={filter.key}
                type="button"
                aria-pressed={active}
                onClick={() => setActiveFilter(filter.key)}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
                  active ? tone.active : tone.idle,
                )}
              >
                {filter.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
                    active ? "bg-white/20 text-white" : "bg-navy/8 text-navy/60",
                  )}
                >
                  {filter.count}
                </span>
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[420px] animate-pulse rounded-2xl border border-navy/10 bg-white"
              />
            ))}
          </div>
        ) : activeExams.length === 0 ? (
          <div className="mt-9 rounded-2xl border border-dashed border-navy/15 bg-white py-20 text-center shadow-sm">
            <FileQuestion className="mx-auto h-12 w-12 text-navy/25" />
            <h3 className="mt-4 text-xl font-semibold text-navy">
              No exams here yet
            </h3>
            <p className="mt-2 text-navy/60">
              Check back soon for new competitions.
            </p>
          </div>
        ) : (
          <div
            key={activeFilter}
            className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {activeExams.map((exam, index) => (
              <ExamCard
                key={exam.id}
                exam={exam}
                isFree={isFreeExam(exam)}
                isAuthenticated={isAuthenticated}
                index={index}
              />
            ))}
          </div>
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
