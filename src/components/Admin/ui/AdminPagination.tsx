import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type AdminPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type AdminPaginationProps = {
  pagination: AdminPaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
};

export function AdminPagination({
  pagination,
  onPageChange,
  className,
}: AdminPaginationProps) {
  const { page, total, totalPages } = pagination;
  const start = total === 0 ? 0 : (page - 1) * pagination.limit + 1;
  const end = Math.min(page * pagination.limit, total);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <p className="text-sm text-slate-500">
        Showing <span className="font-semibold text-navy">{start}</span>–
        <span className="font-semibold text-navy">{end}</span> of{" "}
        <span className="font-semibold text-navy">{total.toLocaleString()}</span>
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-navy transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ChevronLeft className="h-4 w-4" />
          Prev
        </button>
        <span className="min-w-[88px] text-center text-sm font-medium text-slate-600">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="inline-flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-navy transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
