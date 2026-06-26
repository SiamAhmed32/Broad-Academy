"use client";

import { motion } from "framer-motion";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";

type SortOption = "featured" | "rating" | "students" | "newest";

type InstructorFiltersProps = {
  search: string;
  specialty: string | null;
  sort: SortOption;
  specialties: string[];
  isLoading?: boolean;
  onSearchChange: (value: string) => void;
  onSpecialtyChange: (value: string | null) => void;
  onSortChange: (value: SortOption) => void;
};

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "rating", label: "Top Rated" },
  { value: "students", label: "Most Students" },
  { value: "newest", label: "Newest" },
];

const InstructorFilters = ({
  search,
  specialty,
  sort,
  specialties,
  isLoading = false,
  onSearchChange,
  onSpecialtyChange,
  onSortChange,
}: InstructorFiltersProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.3 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="rounded-3xl border border-navy/10 bg-white p-4 shadow-lg shadow-navy/5 sm:p-5"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-navy/40" />
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by name, subject, or expertise..."
            className="h-12 w-full rounded-2xl border border-navy/10 bg-heroBg pl-12 pr-12 text-sm text-navy outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          />
          {isLoading ? (
            <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-navy/40" />
          ) : null}
        </label>

        <label className="relative min-w-[180px]">
          <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-navy/40" />
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value as SortOption)}
            className="h-12 w-full appearance-none rounded-2xl border border-navy/10 bg-heroBg pl-11 pr-4 text-sm font-medium text-navy outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onSpecialtyChange(null)}
          className={`rounded-full px-4 py-2 text-sm font-medium transition ${
            specialty === null
              ? "bg-navy text-soft"
              : "bg-heroBg text-navy/70 hover:bg-navy/10"
          }`}
        >
          All
        </button>
        {specialties.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSpecialtyChange(item)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              specialty === item
                ? "bg-accent text-white"
                : "bg-heroBg text-navy/70 hover:bg-accent/10"
            }`}
          >
            {item}
          </button>
        ))}
      </div>
    </motion.div>
  );
};

export default InstructorFilters;
