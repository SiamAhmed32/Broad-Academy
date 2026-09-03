import { ArrowRight, BookOpen, Clock3, UsersRound } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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
        "course-card-enter group relative flex h-full flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white transition duration-300",
        variant === "carousel"
          ? "shadow-[0_12px_32px_rgba(22,51,81,0.08)]"
          : "shadow-[0_8px_24px_rgba(22,51,81,0.06)] hover:-translate-y-1 hover:border-navy/15 hover:shadow-[0_16px_36px_rgba(22,51,81,0.12)]",
      )}
      style={{ animationDelay: `${Math.min(index, 8) * 55}ms` }}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-navy/5">
        <Image
          src={course.thumbnailUrl}
          alt={`${course.title} course`}
          fill
          priority={index < 2}
          sizes="(max-width: 768px) 92vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition duration-700 group-hover:scale-[1.03]"
        />
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-semibold leading-snug tracking-[-0.02em] text-navy">
          {course.title}
        </h3>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-[-0.03em] text-navy">
              ৳{course.price.toLocaleString("en-US")}
            </span>
            {course.originalPrice ? (
              <span className="text-sm text-navy/45 line-through">
                ৳{course.originalPrice.toLocaleString("en-US")}
              </span>
            ) : null}
            {discount ? (
              <span className="rounded-md bg-btnBg/10 px-1.5 py-0.5 text-[11px] font-semibold text-btnBg">
                {discount}% OFF
              </span>
            ) : null}
          </div>
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-navy/55">
            <span className="h-1.5 w-1.5 rounded-full bg-btnBg" />
            Online
          </span>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2 border-t border-navy/10 pt-3.5">
          <CourseMetric icon={BookOpen} label={`${course.lessonCount} Lessons`} />
          <CourseMetric icon={Clock3} label={durationLabel} />
          <CourseMetric
            icon={UsersRound}
            label={`${compactNumber(course.studentsCount)} Students`}
          />
        </div>

        <div className="mt-auto pt-5">
          <Link
            href={`/courses/${course.slug}`}
            aria-label={`View ${course.title}`}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-navy text-sm font-semibold text-white transition group-hover:bg-btnBg"
          >
            এনরোল করুন
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function CourseMetric({
  icon: Icon,
  label,
}: {
  icon: typeof BookOpen;
  label: string;
}) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-navy/60">
      <Icon className="h-3.5 w-3.5 shrink-0 text-navy/40" />
      {label}
    </span>
  );
}

function compactNumber(value: number) {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}
