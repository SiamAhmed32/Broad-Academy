"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  Clock3,
  FileQuestion,
  Sparkles,
} from "lucide-react";
import Link from "next/link";

import { cloudinaryCoverImage } from "@/lib/media/images";
import { cn } from "@/lib/utils";

export type ExamCardData = {
  id: string;
  slug: string;
  title: string;
  code: string | null;
  description: string | null;
  bannerUrl: string | null;
  price: number;
  originalPrice: number | null;
  durationMinutes: number;
  totalMarks: number;
};

type ExamCardProps = {
  exam: ExamCardData;
  isFree: boolean;
  isAuthenticated: boolean;
  index?: number;
};

function MetaTile({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-heroBg px-3 py-2.5 ring-1 ring-navy/6">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-navy/45">
        <Icon className="h-3 w-3 text-accent" />
        {label}
      </div>
      <p className="mt-1 text-xs font-semibold leading-5 text-navy">{value}</p>
    </div>
  );
}

export default function ExamCard({
  exam,
  isFree,
  isAuthenticated,
  index = 0,
}: ExamCardProps) {
  const bannerSrc = exam.bannerUrl
    ? cloudinaryCoverImage(exam.bannerUrl, 960, 540)
    : null;
  const examHref = isAuthenticated
    ? `/exams/${exam.slug}`
    : `/login?next=/exams/${encodeURIComponent(exam.slug)}`;

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="group h-full"
    >
      <Link
        href={examHref}
        className="flex h-full flex-col overflow-hidden rounded-[1.75rem] border border-navy/10 bg-white shadow-[0_16px_45px_rgba(22,51,81,0.08)] transition-shadow duration-300 hover:border-accent/25 hover:shadow-[0_24px_55px_rgba(22,51,81,0.14)]"
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-navy">
          {bannerSrc ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={bannerSrc}
                alt={exam.title}
                className="absolute inset-0 block h-full w-full object-cover object-center transition duration-700 group-hover:scale-[1.04]"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-navy/35 via-transparent to-black/10" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy via-[#0f2740] to-navy" />
          )}

          <div className="absolute inset-0 z-10 flex items-start justify-between p-4">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-navy shadow-sm backdrop-blur-sm">
              <Sparkles className="h-3 w-3 text-accent" />
              MCQ
            </span>
            {exam.code ? (
              <span className="max-w-[45%] truncate rounded-full bg-white/90 px-2.5 py-1 font-mono text-[10px] font-semibold text-navy/75 shadow-sm backdrop-blur-sm">
                {exam.code}
              </span>
            ) : null}
          </div>

          {!bannerSrc ? (
            <div className="absolute inset-0 z-10 flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white/80 backdrop-blur-sm">
                <FileQuestion className="h-7 w-7" />
              </div>
            </div>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-5 sm:p-6">
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent">
              {isFree ? "Free competition" : "Premium exam"}
            </p>
            <h3 className="mt-1 line-clamp-2 text-lg font-semibold tracking-[-0.02em] text-navy transition-colors group-hover:text-accent">
              {exam.title}
            </h3>
            {exam.description ? (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-navy/60">
                {exam.description}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <MetaTile
              icon={Clock3}
              label="Duration"
              value={`${exam.durationMinutes} min`}
            />
            <MetaTile
              icon={Award}
              label="Total marks"
              value={`${exam.totalMarks}`}
            />
          </div>

          <div className="mt-auto pt-5">
            {!isFree ? (
              <div className="mb-3 flex items-baseline gap-2">
                <span className="text-xl font-bold text-navy">
                  BDT {exam.price.toLocaleString()}
                </span>
                {exam.originalPrice && exam.originalPrice > exam.price ? (
                  <span className="text-sm text-navy/40 line-through">
                    BDT {exam.originalPrice.toLocaleString()}
                  </span>
                ) : null}
              </div>
            ) : null}

            <span
              className={cn(
                "flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-accent text-sm font-semibold text-white transition group-hover:bg-accent/90",
              )}
            >
              {isAuthenticated ? "Enter exam" : "Log in to enter"}
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
