"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { Container } from "@/components/reusables";
import type { InstructorsListResponse } from "@/lib/instructors/types";

import InstructorCard from "./InstructorCard";
import InstructorCTA from "./InstructorCTA";
import InstructorFilters from "./InstructorFilters";
import InstructorHero from "./InstructorHero";
import InstructorStats from "./InstructorStats";

type InstructorsPageProps = {
  initialData: InstructorsListResponse["data"];
};

const InstructorsPage = ({ initialData }: InstructorsPageProps) => {
  const shouldReduceMotion = useReducedMotion();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState(initialData);
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState<string | null>(null);
  const [sort, setSort] = useState<"featured" | "rating" | "students" | "newest">(
    "featured",
  );
  const [page, setPage] = useState(1);
  const isFirstRender = useRef(true);

  const fetchInstructors = useCallback(
    async (
      nextSearch: string,
      nextSpecialty: string | null,
      nextSort: typeof sort,
      nextPage: number,
    ) => {
      const params = new URLSearchParams();
      if (nextSearch) params.set("search", nextSearch);
      if (nextSpecialty) params.set("specialty", nextSpecialty);
      params.set("sort", nextSort);
      params.set("page", String(nextPage));
      params.set("limit", "12");

      const response = await fetch(`/api/instructors?${params.toString()}`);
      if (!response.ok) return;

      const payload = (await response.json()) as InstructorsListResponse;
      if (payload.success) {
        setData(payload.data);
      }
    },
    [],
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition(() => {
        void fetchInstructors(search, specialty, sort, page);
      });
    }, 300);

    return () => window.clearTimeout(timer);
  }, [fetchInstructors, page, search, sort, specialty]);

  const featuredInstructors = data.instructors.filter((item) => item.featured);
  const showFeatured = !search && !specialty && page === 1 && featuredInstructors.length > 0;

  return (
    <main className="overflow-hidden bg-soft">
      <InstructorHero />

      <InstructorStats total={data.pagination.total} />

      <section className="relative py-12 sm:py-16">
        <div className="absolute left-[-6rem] top-20 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute bottom-10 right-[-4rem] h-72 w-72 rounded-full bg-btnBg/10 blur-3xl" />

        <Container className="relative">
          <InstructorFilters
            search={search}
            specialty={specialty}
            sort={sort}
            specialties={data.specialties}
            isLoading={isPending}
            onSearchChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            onSpecialtyChange={(value) => {
              setSpecialty(value);
              setPage(1);
            }}
            onSortChange={(value) => {
              setSort(value);
              setPage(1);
            }}
          />

          {showFeatured ? (
            <motion.div
              initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.2 }}
              transition={{ duration: 0.55, ease: "easeOut" }}
              className="mt-12"
            >
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy text-soft">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                    Spotlight
                  </p>
                  <h2 className="text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
                    Featured Mentors
                  </h2>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {featuredInstructors.slice(0, 3).map((instructor, index) => (
                  <InstructorCard
                    key={instructor.id}
                    instructor={instructor}
                    index={index}
                    featured
                  />
                ))}
              </div>
            </motion.div>
          ) : null}

          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-12"
          >
            <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-accent">
                  All Mentors
                </p>
                <h2 className="text-2xl font-semibold tracking-[-0.03em] text-navy sm:text-3xl">
                  {data.pagination.total} Expert Instructors
                </h2>
              </div>
              {isPending ? (
                <span className="text-sm font-medium text-navy/50">Updating...</span>
              ) : null}
            </div>

            {data.instructors.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-navy/15 bg-white px-6 py-16 text-center shadow-lg shadow-navy/5">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-heroBg text-navy">
                  <Search className="h-7 w-7" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-navy">
                  No instructors found
                </h3>
                <p className="mx-auto mt-3 max-w-md leading-7 text-navy/60">
                  Try adjusting your search or filter. Our mentor directory updates
                  regularly with new experts.
                </p>
              </div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {data.instructors.map((instructor, index) => (
                  <InstructorCard
                    key={instructor.id}
                    instructor={instructor}
                    index={index}
                  />
                ))}
              </div>
            )}

            {data.pagination.totalPages > 1 ? (
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={page <= 1 || isPending}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="rounded-full border border-navy/15 bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-navy hover:text-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="rounded-full bg-navy px-4 py-2 text-sm font-medium text-soft">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= data.pagination.totalPages || isPending}
                  onClick={() =>
                    setPage((current) =>
                      Math.min(data.pagination.totalPages, current + 1),
                    )
                  }
                  className="rounded-full border border-navy/15 bg-white px-5 py-2.5 text-sm font-semibold text-navy transition hover:bg-navy hover:text-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            ) : null}
          </motion.div>
        </Container>
      </section>

      <InstructorCTA />
    </main>
  );
};

export default InstructorsPage;
