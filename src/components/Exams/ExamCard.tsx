"use client";

import { ArrowRight, Award, ClipboardList } from "lucide-react";
import Link from "next/link";

import { examBannerArt, examCardTheme } from "@/lib/exams/card-theme";
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
  questionCount: number;
};

type ExamCardProps = {
  exam: ExamCardData;
  isFree: boolean;
  isAuthenticated: boolean;
  index?: number;
};

export default function ExamCard({
  exam,
  isFree,
  isAuthenticated,
  index = 0,
}: ExamCardProps) {
  const theme = examCardTheme(exam.slug);
  const art = examBannerArt(exam.title, exam.code);
  const bannerSrc = exam.bannerUrl
    ? cloudinaryCoverImage(exam.bannerUrl, 960, 540)
    : null;
  const examHref = isAuthenticated
    ? `/exams/${exam.slug}`
    : `/login?next=/exams/${encodeURIComponent(exam.slug)}`;
  const discount =
    exam.originalPrice && exam.originalPrice > exam.price
      ? Math.round((1 - exam.price / exam.originalPrice) * 100)
      : null;
  const questionCount = exam.questionCount ?? 0;
  const totalMarks = exam.totalMarks ?? 0;

  return (
    <article
      className="course-card-enter group relative flex h-full flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-[0_8px_24px_rgba(22,51,81,0.06)] transition duration-300 hover:-translate-y-1 hover:border-navy/15 hover:shadow-[0_16px_36px_rgba(22,51,81,0.12)]"
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        {bannerSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerSrc}
              alt={exam.title}
              className="absolute inset-0 h-full w-full object-cover object-top transition duration-700 group-hover:scale-[1.03]"
            />
            <div className="pointer-events-none absolute inset-0 bg-navy/25" />
          </>
        ) : (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-br transition duration-700 group-hover:scale-[1.03]",
              theme.banner,
            )}
          >
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
            <div className="absolute inset-0 flex flex-col justify-end p-4 pb-3">
              <p className="max-w-[75%] text-[15px] font-extrabold uppercase leading-[1.15] tracking-[-0.01em] text-white">
                {art.label}
              </p>
              {art.number ? (
                <p className="mt-0.5 text-[2.75rem] font-black leading-none tracking-[-0.05em] text-white/95">
                  {art.number}
                </p>
              ) : null}
            </div>
          </div>
        )}

        <span
          className={cn(
            "absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur",
            isFree ? theme.badgeText : "text-[#c2540a]",
          )}
        >
          {isFree ? "Free" : "Paid"}
        </span>
        {exam.code ? (
          <span className="absolute right-3 top-3 max-w-[45%] truncate rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-navy shadow-sm backdrop-blur">
            {exam.code}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-semibold leading-snug tracking-[-0.02em] text-navy">
          {exam.title}
        </h3>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-[-0.03em] text-navy">
              ৳{exam.price.toLocaleString("en-US")}
            </span>
            {exam.originalPrice && exam.originalPrice > exam.price ? (
              <span className="text-sm text-navy/45 line-through">
                ৳{exam.originalPrice.toLocaleString("en-US")}
              </span>
            ) : null}
            {discount ? (
              <span className="rounded-md bg-btnBg/10 px-1.5 py-0.5 text-[11px] font-semibold text-btnBg">
                {discount}% OFF
              </span>
            ) : null}
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-navy/55">
            <span className="h-1.5 w-1.5 rounded-full bg-[#047857]" />
            Online
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-navy/10 pt-3.5">
          <ExamMetric
            icon={ClipboardList}
            label={`${questionCount} ${questionCount === 1 ? "Question" : "Questions"}`}
          />
          <ExamMetric
            icon={Award}
            label={`${totalMarks} ${totalMarks === 1 ? "Mark" : "Marks"}`}
          />
        </div>

        <div className="mt-auto pt-5">
          <Link
            href={examHref}
            aria-label={`View ${exam.title}`}
            className={cn(
              "flex h-11 w-full items-center justify-center rounded-xl text-sm font-semibold text-white transition",
              theme.button,
            )}
          >
            এনরোল করুন
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function ExamMetric({
  icon: Icon,
  label,
}: {
  icon: typeof ClipboardList;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-sm font-semibold text-navy">
      <Icon className="h-4 w-4 shrink-0 text-navy" />
      {label}
    </span>
  );
}
