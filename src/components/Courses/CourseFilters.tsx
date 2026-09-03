"use client";

import { Loader2, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { courseSortOptions } from "@/lib/courses/constants";
import type { CoursesListData } from "@/lib/courses/types";
import { courseQueryParams } from "@/lib/courses/utils";
import type { CourseListQuery, CourseSort } from "@/lib/courses/validation";

export default function CourseFilters({
  query,
  categories,
}: {
  query: CourseListQuery;
  categories: CoursesListData["categories"];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchVal, setSearchVal] = useState(query.search ?? "");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  function applyFilters(newQuery: Partial<CourseListQuery>) {
    const params = courseQueryParams({ ...query, ...newQuery }, { page: 1 });
    startTransition(() => {
      router.push(`${pathname}${params.size ? `?${params}` : ""}`, {
        scroll: false,
      });
    });
  }

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setSearchVal(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      applyFilters({ search: value });
    }, 400);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
      <label className="relative flex-1">
        <span className="sr-only">Search courses</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
        <input
          type="search"
          value={searchVal}
          onChange={handleSearchChange}
          placeholder="Search course, subject, or instructor"
          maxLength={80}
          className="h-12 w-full rounded-full border border-navy/10 bg-white pl-11 pr-10 text-sm text-navy shadow-sm outline-none transition focus:border-btnBg focus:ring-4 focus:ring-btnBg/10"
        />
        {isPending ? (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-navy/40" />
        ) : null}
      </label>

      <FilterSelect
        label="Subject"
        value={query.category ?? ""}
        onChange={(value) => applyFilters({ category: value || undefined })}
      >
        <option value="">All subjects</option>
        {categories.map((category) => (
          <option key={category.value} value={category.value}>
            {category.label} ({category.count})
          </option>
        ))}
      </FilterSelect>

      <FilterSelect
        label="Sort courses"
        value={query.sort}
        onChange={(value) => applyFilters({ sort: value as CourseSort })}
      >
        {courseSortOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </FilterSelect>
    </div>
  );
}

function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="sm:w-44">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full appearance-none rounded-full border border-navy/10 bg-white px-4 text-sm font-medium text-navy shadow-sm outline-none transition focus:border-btnBg focus:ring-4 focus:ring-btnBg/10"
      >
        {children}
      </select>
    </label>
  );
}
