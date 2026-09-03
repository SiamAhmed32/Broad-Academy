import { Search } from "lucide-react";
import Link from "next/link";

import { Container, SectionHeading } from "@/components/reusables";
import type { CoursesListData } from "@/lib/courses/types";
import type { CourseListQuery } from "@/lib/courses/validation";
import CourseCard from "./CourseCard";
import CourseFilters from "./CourseFilters";
import CourseLevelTabs from "./CourseLevelTabs";
import CoursePagination from "./CoursePagination";

export default function CoursesPage({
  data,
  query,
}: {
  data: CoursesListData;
  query: CourseListQuery;
}) {
  return (
    <main className="bg-[#f7f9fc] pb-16 pt-12 sm:pb-20 sm:pt-14">
      <Container>
        <SectionHeading title="আমাদের কোর্সসমূহ" />

        <div className="mt-8">
          <CourseFilters query={query} categories={data.categories} />
        </div>

        <div className="mt-7">
          <CourseLevelTabs query={query} levels={data.levels} />
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm text-navy/55">
          <p>{resultSummary(data.pagination.total, query)}</p>
          {data.pagination.totalPages > 1 ? (
            <p>
              Page {data.pagination.page} of {data.pagination.totalPages}
            </p>
          ) : null}
        </div>

        {data.courses.length ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {data.courses.map((course, index) => (
              <CourseCard key={course.id} course={course} index={index} />
            ))}
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-dashed border-navy/15 bg-white px-6 py-16 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-heroBg text-navy">
              <Search className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-navy">
              No matching courses
            </h2>
            <p className="mx-auto mt-3 max-w-md leading-7 text-navy/75">
              Try a broader search, another class, or clear the active filters.
            </p>
            <Link
              href="/courses"
              className="mt-7 inline-flex rounded-xl bg-navy px-5 py-3 text-sm font-bold text-white transition hover:bg-btnBg"
            >
              View all courses
            </Link>
          </div>
        )}

        <CoursePagination
          query={query}
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
        />
      </Container>
    </main>
  );
}

function resultSummary(total: number, query: CourseListQuery) {
  if (query.search)
    return `${total} result${total === 1 ? "" : "s"} for “${query.search}”`;
  if (query.category)
    return `${total} ${query.category} course${total === 1 ? "" : "s"}`;
  return `${total} course${total === 1 ? "" : "s"} to explore`;
}
