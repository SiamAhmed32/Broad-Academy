import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import type { CourseListQuery } from "@/lib/courses/validation";
import { courseQueryParams } from "@/lib/courses/utils";

export default function CoursePagination({
  query,
  page,
  totalPages,
}: {
  query: CourseListQuery;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const pages = pageWindow(page, totalPages);

  return (
    <nav
      aria-label="Course pagination"
      className="mt-12 flex flex-wrap items-center justify-center gap-2"
    >
      <PaginationLink query={query} page={page - 1} disabled={page <= 1} label="Previous">
        <ChevronLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Previous</span>
      </PaginationLink>

      {pages.map((item, index) =>
        item === "ellipsis" ? (
          <span key={`ellipsis-${index}`} className="px-2 text-navy/65">
            …
          </span>
        ) : (
          <Link
            key={item}
            href={coursePageHref(query, item)}
            aria-current={item === page ? "page" : undefined}
            className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition ${
              item === page
                ? "bg-navy text-white shadow-lg shadow-navy/15"
                : "border border-navy/10 bg-white text-navy hover:border-btnBg hover:text-btnBg"
            }`}
          >
            {item}
          </Link>
        ),
      )}

      <PaginationLink
        query={query}
        page={page + 1}
        disabled={page >= totalPages}
        label="Next"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="h-4 w-4" />
      </PaginationLink>
    </nav>
  );
}

function PaginationLink({
  query,
  page,
  disabled,
  label,
  children,
}: {
  query: CourseListQuery;
  page: number;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  const className =
    "flex h-10 items-center justify-center gap-1 rounded-xl border border-navy/10 bg-white px-3 text-sm font-bold text-navy transition hover:border-btnBg hover:text-btnBg";

  if (disabled) {
    return (
      <span aria-disabled="true" className={`${className} cursor-not-allowed opacity-40`}>
        {children}
      </span>
    );
  }

  return (
    <Link
      href={coursePageHref(query, page)}
      aria-label={`${label} page`}
      className={className}
    >
      {children}
    </Link>
  );
}

function coursePageHref(query: CourseListQuery, page: number) {
  const params = courseQueryParams(query, { page });
  return `/courses${params.size ? `?${params}` : ""}`;
}

function pageWindow(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const values = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...values].filter((value) => value >= 1 && value <= total).sort((a, b) => a - b);
  const result: (number | "ellipsis")[] = [];

  sorted.forEach((value, index) => {
    const previous = sorted[index - 1];
    if (previous && value - previous > 1) result.push("ellipsis");
    result.push(value);
  });

  return result;
}
