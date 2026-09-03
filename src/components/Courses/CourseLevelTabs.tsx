import type { CourseLevel } from "@/generated/prisma/client";
import Link from "next/link";

import { courseLevelSlugs } from "@/lib/courses/constants";
import type { CoursesListData } from "@/lib/courses/types";
import { courseQueryParams } from "@/lib/courses/utils";
import type { CourseListQuery } from "@/lib/courses/validation";
import { cn } from "@/lib/utils";

export default function CourseLevelTabs({
  query,
  levels,
}: {
  query: CourseListQuery;
  levels: CoursesListData["levels"];
}) {
  if (!levels.length) return null;

  const totalCount = levels.reduce((sum, level) => sum + level.count, 0);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5">
      <LevelTab
        href={levelHref(query)}
        label="সব কোর্সসমূহ"
        count={totalCount}
        active={!query.level}
      />
      {levels.map((level) => {
        const slug = courseLevelSlugs[level.value as CourseLevel];
        return (
          <LevelTab
            key={level.value}
            href={levelHref(query, slug)}
            label={level.label}
            count={level.count}
            active={query.level === slug}
          />
        );
      })}
    </div>
  );
}

function LevelTab({
  href,
  label,
  count,
  active,
}: {
  href: string;
  label: string;
  count: number;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition",
        active
          ? "border-navy bg-navy text-white shadow-[0_10px_24px_rgba(22,51,81,0.2)]"
          : "border-navy/10 bg-white text-navy hover:border-navy/25 hover:bg-navy/5",
      )}
    >
      {label}
      <span
        className={cn(
          "rounded-full px-1.5 py-0.5 text-[11px] font-bold",
          active ? "bg-white/20 text-white" : "bg-navy/8 text-navy/60",
        )}
      >
        {count}
      </span>
    </Link>
  );
}

function levelHref(query: CourseListQuery, level?: string) {
  const params = courseQueryParams(query, { remove: "level", page: 1 });
  if (level) params.set("level", level);
  return `/courses${params.size ? `?${params}` : ""}`;
}
