"use client";

import { Search, SlidersHorizontal, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTransition, useRef, useEffect, useState } from "react";

import {
  courseLevelOptions,
  courseSortOptions,
} from "@/lib/courses/constants";
import type { CoursesListData } from "@/lib/courses/types";
import { courseQueryParams } from "@/lib/courses/utils";
import type { CourseListQuery } from "@/lib/courses/validation";

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

  const activeFilters = Boolean(query.search || query.category || query.level);

  function applyFilters(newQuery: Partial<CourseListQuery>) {
    const mergedQuery = { ...query, ...newQuery };
    const params = courseQueryParams(mergedQuery, { page: 1 });
    startTransition(() => {
      router.push(`${pathname}${params.size ? `?${params}` : ""}`, { scroll: false });
    });
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setSearchVal(val);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      applyFilters({ search: val });
    }, 400); // 400ms debounce
  }

  return (
    <div className="relative z-20 -mt-8 rounded-[1.6rem] border border-navy/10 bg-white p-4 shadow-[0_20px_50px_rgba(22,51,81,0.12)] sm:p-5">
      <div className="grid gap-3 lg:grid-cols-[1fr_200px_200px_200px]">
        <label className="relative">
          <span className="sr-only">Search courses</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-navy/40" />
          <input
            type="search"
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Search course, subject, or instructor"
            maxLength={80}
            className="h-12 w-full rounded-2xl border border-navy/10 bg-[#f6f9fc] pl-11 pr-10 text-sm text-navy outline-none transition focus:border-btnBg focus:ring-4 focus:ring-btnBg/10"
          />
          {isPending && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="h-4 w-4 animate-spin text-navy/40" />
            </div>
          )}
        </label>

        <FilterSelect 
          value={query.category ?? ""} 
          onChange={(val) => applyFilters({ category: val })}
          label="Category"
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label} ({category.count})
            </option>
          ))}
        </FilterSelect>

        <FilterSelect 
          value={query.level ?? ""} 
          onChange={(val) => applyFilters({ level: val as any })}
          label="Level"
        >
          <option value="">All levels</option>
          {courseLevelOptions.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </FilterSelect>

        <FilterSelect 
          value={query.sort} 
          onChange={(val) => applyFilters({ sort: val as any })}
          label="Sort courses"
        >
          {courseSortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </FilterSelect>
      </div>

      {activeFilters ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-navy/8 pt-4">
          <span className="mr-1 text-xs font-semibold uppercase tracking-[0.14em] text-navy/40">
            Active
          </span>
          {query.search ? <ActiveFilter label={`“${query.search}”`} query={query} remove="search" /> : null}
          {query.category ? <ActiveFilter label={query.category} query={query} remove="category" /> : null}
          {query.level ? (
            <ActiveFilter
              label={courseLevelOptions.find((item) => item.value === query.level)?.label ?? query.level}
              query={query}
              remove="level"
            />
          ) : null}
          <Link
            href="/courses"
            className="ml-auto text-xs font-bold text-btnBg hover:underline"
          >
            Clear all
          </Link>
        </div>
      ) : null}
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
    <label>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 w-full appearance-none rounded-2xl border border-navy/10 bg-[#f6f9fc] px-4 text-sm font-medium text-navy outline-none transition focus:border-btnBg focus:ring-4 focus:ring-btnBg/10"
      >
        {children}
      </select>
    </label>
  );
}

function ActiveFilter({
  label,
  query,
  remove,
}: {
  label: string;
  query: CourseListQuery;
  remove: "search" | "category" | "level";
}) {
  const params = courseQueryParams(query, { remove, page: 1 });
  return (
    <Link
      href={`/courses${params.size ? `?${params}` : ""}`}
      className="inline-flex items-center gap-1.5 rounded-full bg-heroBg px-3 py-1.5 text-xs font-semibold text-navy transition hover:bg-navy/10"
    >
      {label}
      <X className="h-3 w-3" />
    </Link>
  );
}

