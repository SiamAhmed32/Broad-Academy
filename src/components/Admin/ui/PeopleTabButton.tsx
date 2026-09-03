"use client";

import { cn } from "@/lib/utils";

export function PeopleTabButton({
  active,
  onClick,
  label,
  description,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  description?: string;
  count?: number | null;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-w-[180px] flex-1 flex-col rounded-2xl border px-4 py-3 text-left transition",
        active
          ? "border-navy bg-navy text-white shadow-md"
          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{label}</span>
        {count != null ? (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-bold",
              active ? "bg-white/15 text-white" : "bg-slate-100 text-slate-600",
            )}
          >
            {count.toLocaleString()}
          </span>
        ) : null}
      </span>
      {description ? (
        <span
          className={cn(
            "mt-1 text-xs leading-5",
            active ? "text-white/75" : "text-slate-500",
          )}
        >
          {description}
        </span>
      ) : null}
    </button>
  );
}
