import { BookOpenCheck, Search, ShieldCheck, Sparkles } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/reusables";
import type { CoursesListData } from "@/lib/courses/types";
import type { CourseListQuery } from "@/lib/courses/validation";
import CourseCard from "./CourseCard";
import CourseFilters from "./CourseFilters";
import CoursePagination from "./CoursePagination";

export default function CoursesPage({
  data,
  query,
}: {
  data: CoursesListData;
  query: CourseListQuery;
}) {
  return (
    <main className="overflow-hidden bg-[#f7f9fc]">
      <section className="relative bg-navy pb-20 pt-14 text-white sm:pb-24 sm:pt-18">
        <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,.18)_1px,transparent_0)] [background-size:30px_30px]" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-[6rem] bg-btnBg/35" />
        <Container className="relative">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
              <Sparkles className="h-4 w-4 text-[#8cf0d0]" />
              Find your next course
            </span>
            <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.045em] sm:text-5xl lg:text-6xl">
              Learn with clarity.
              <span className="block text-[#8cf0d0]">Progress with confidence.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">
              Explore structured, teacher-guided courses built for Bangladeshi
              students from Class 6 to Class 12.
            </p>
          </div>
          <div className="mt-9 flex flex-wrap gap-3 text-sm text-white/70">
            <HeroPoint icon={BookOpenCheck} label="Chapter-wise learning" />
            <HeroPoint icon={ShieldCheck} label="Trusted academic guidance" />
          </div>
        </Container>
      </section>

      <Container>
        <CourseFilters query={query} categories={data.categories} />
      </Container>

      <section className="py-12 sm:py-16">
        <Container>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#047857]">
                Course catalogue
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em] text-navy sm:text-3xl">
                {resultHeading(data.pagination.total, query)}
              </h2>
            </div>
            <p className="text-sm text-navy/70">
              Page {data.pagination.page} of {data.pagination.totalPages}
            </p>
          </div>

          {data.courses.length ? (
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {data.courses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
              ))}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-dashed border-navy/15 bg-white px-6 py-18 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-heroBg text-navy">
                <Search className="h-7 w-7" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-navy">
                No matching courses
              </h2>
              <p className="mx-auto mt-3 max-w-md leading-7 text-navy/75">
                Try a broader search, another level, or clear the active filters.
              </p>
              <Link
                href="/courses"
                className="mt-7 inline-flex rounded-xl bg-[#0068cf] px-5 py-3 text-sm font-bold text-white"
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
      </section>
    </main>
  );
}

function HeroPoint({
  icon: Icon,
  label,
}: {
  icon: typeof BookOpenCheck;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2">
      <Icon className="h-4 w-4 text-[#8cf0d0]" />
      {label}
    </span>
  );
}

function resultHeading(total: number, query: CourseListQuery) {
  if (query.search) return `${total} result${total === 1 ? "" : "s"} for “${query.search}”`;
  if (query.category) return `${total} ${query.category} course${total === 1 ? "" : "s"}`;
  return `${total} course${total === 1 ? "" : "s"} to explore`;
}
