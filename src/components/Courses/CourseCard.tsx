import {
  ArrowUpRight,
  BookOpen,
  Clock3,
  Star,
  UsersRound,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { courseLevelLabels } from "@/lib/courses/constants";
import { formatCourseDuration } from "@/lib/courses/content-format";
import type { PublicCourse } from "@/lib/courses/types";
import { cn } from "@/lib/utils";

export default function CourseCard({
  course,
  index = 0,
  variant = "grid",
}: {
  course: PublicCourse;
  index?: number;
  variant?: "grid" | "carousel";
}) {
  const durationLabel = formatCourseDuration(
    course.durationMinutes,
    course.lessonCount,
  );
  const discount =
    course.originalPrice && course.originalPrice > course.price
      ? Math.round((1 - course.price / course.originalPrice) * 100)
      : null;

  return (
    <article
      className={cn(
        "course-card-enter group relative flex h-full flex-col overflow-hidden rounded-[1.75rem] border bg-white transition duration-300",
        variant === "carousel"
          ? "border-navy/8 shadow-[0_20px_50px_rgba(22,51,81,0.1)]"
          : "border-navy/10 shadow-[0_16px_45px_rgba(22,51,81,0.08)] hover:-translate-y-1.5 hover:shadow-[0_24px_55px_rgba(22,51,81,0.14)]",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-navy/10 to-btnBg/5">
        <Image
          src={course.thumbnailUrl}
          alt={`${course.title} course`}
          fill
          priority={index < 2}
          sizes="(max-width: 768px) 92vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy/70 via-navy/10 to-transparent" />
        <div className="absolute left-4 top-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold text-navy shadow-sm backdrop-blur">
            {courseLevelLabels[course.level]}
          </span>
          {course.featured ? (
            <span className="rounded-full bg-btnBg/90 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
              Featured
            </span>
          ) : null}
          {course.badge ? (
            <span className="rounded-full bg-[#047857] px-3 py-1.5 text-[11px] font-bold text-white shadow-sm">
              {course.badge}
            </span>
          ) : null}
        </div>
        {discount ? (
          <span className="absolute bottom-4 right-4 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-[#0068cf] shadow-md">
            Save {discount}%
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#047857]">
            {course.category}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-amber-700">
            <Star className="h-4 w-4 fill-current" />
            {course.rating.toFixed(1)}
            <span className="font-normal text-navy/55">({course.reviewCount})</span>
          </span>
        </div>

        <h3 className="mt-3 line-clamp-2 text-xl font-semibold leading-snug tracking-[-0.025em] text-navy">
          {course.title}
        </h3>
        <p className="mt-2.5 line-clamp-2 text-sm leading-6 text-navy/70">
          {course.shortDescription}
        </p>
        <p className="mt-3 text-sm font-medium text-navy/55">
          With {course.instructorName}
        </p>

        <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border border-navy/6 bg-[#f8fafc] py-3.5 text-center">
          <CourseMetric icon={BookOpen} value={`${course.lessonCount}`} label="Lessons" />
          <CourseMetric icon={Clock3} value={durationLabel} label="Duration" />
          <CourseMetric
            icon={UsersRound}
            value={compactNumber(course.studentsCount)}
            label="Students"
          />
        </div>

        <div className="mt-auto flex items-end justify-between gap-4 pt-5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-navy/45">
              Course fee
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-bold tracking-[-0.04em] text-navy">
                ৳{course.price.toLocaleString("en-US")}
              </span>
              {course.originalPrice ? (
                <span className="text-sm text-navy/50 line-through">
                  ৳{course.originalPrice.toLocaleString("en-US")}
                </span>
              ) : null}
            </div>
          </div>
          <Link
            href={`/courses/${course.slug}`}
            aria-label={`View ${course.title}`}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-navy text-white shadow-lg shadow-navy/20 transition group-hover:bg-btnBg group-hover:shadow-btnBg/25"
          >
            <ArrowUpRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CourseMetric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof BookOpen;
  value: string;
  label: string;
}) {
  return (
    <div>
      <span className="flex items-center justify-center gap-1.5 text-sm font-bold text-navy">
        <Icon className="h-3.5 w-3.5 text-btnBg" />
        {value}
      </span>
      <span className="mt-1 block text-[10px] font-medium text-navy/50">{label}</span>
    </div>
  );
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
