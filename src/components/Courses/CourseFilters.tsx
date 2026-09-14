"use client";

import { Loader2, Search } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import type { CoursesListData } from "@/lib/courses/types";
import { courseQueryParams } from "@/lib/courses/utils";
import type { CourseListQuery } from "@/lib/courses/validation";

const SEARCH_DEBOUNCE_MS = 300;

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
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryRef = useRef(query);
  queryRef.current = query;

  useEffect(() => {
    setSearchVal(query.search ?? "");
  }, [query.search]);

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  function applyFilters(
    newQuery: Partial<CourseListQuery>,
    options?: { replace?: boolean },
  ) {
    const params = courseQueryParams(
      { ...queryRef.current, ...newQuery },
      { page: 1 },
    );
    const href = `${pathname}${params.size ? `?${params}` : ""}`;
    startTransition(() => {
      if (options?.replace) {
        router.replace(href, { scroll: false });
      } else {
        router.push(href, { scroll: false });
      }
    });
  }

  function commitSearch(value: string) {
    const next = value.trim();
    const current = queryRef.current.search ?? "";
    if (next === current) return;
    if (next.length === 1 && !/^\d+$/.test(next)) return;
    applyFilters({ search: next || undefined }, { replace: true });
  }

  function handleSearchChange(event: React.ChangeEvent<HTMLInputElement>) {
    const value = event.target.value;
    setSearchVal(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      commitSearch(value);
    }, SEARCH_DEBOUNCE_MS);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    commitSearch(searchVal);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 sm:flex-row">
      <form className="relative flex-1" onSubmit={handleSearchSubmit}>
        <label className="block">
          <span className="sr-only">Search courses</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
          <input
            type="search"
            value={searchVal}
            onChange={handleSearchChange}
            placeholder="Search course, subject, or instructor"
            maxLength={80}
            autoComplete="off"
            className="h-12 w-full rounded-full border border-navy/10 bg-white pl-11 pr-10 text-sm text-navy shadow-sm outline-none transition focus:border-btnBg focus:ring-4 focus:ring-btnBg/10"
          />
        </label>
        {isPending ? (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-navy/40" />
        ) : null}
      </form>

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
