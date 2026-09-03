"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleSlash,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import {
  STUDENT_PROGRESS_STATUS_LABELS,
  type StudentProgressStatus,
} from "@/lib/students/progress";
import { cn } from "@/lib/utils";

type StatusTone = {
  label: string;
  icon: LucideIcon;
  /** Badge pill. */
  badge: string;
  /** Summary-card icon tile. */
  tile: string;
  /** Progress bar fill. */
  bar: string;
  /** Last-active dot. */
  dot: string;
};

export const STUDENT_PROGRESS_TONES: Record<StudentProgressStatus, StatusTone> = {
  ON_TRACK: {
    label: STUDENT_PROGRESS_STATUS_LABELS.ON_TRACK,
    icon: CheckCircle2,
    badge: "bg-emerald-100 text-emerald-800",
    tile: "bg-emerald-50 text-emerald-600",
    bar: "bg-emerald-500",
    dot: "bg-emerald-500",
  },
  NEEDS_ATTENTION: {
    label: STUDENT_PROGRESS_STATUS_LABELS.NEEDS_ATTENTION,
    icon: AlertTriangle,
    badge: "bg-amber-100 text-amber-800",
    tile: "bg-amber-50 text-amber-600",
    bar: "bg-amber-500",
    dot: "bg-amber-500",
  },
  AT_RISK: {
    label: STUDENT_PROGRESS_STATUS_LABELS.AT_RISK,
    icon: AlertTriangle,
    badge: "bg-red-100 text-red-700",
    tile: "bg-red-50 text-red-600",
    bar: "bg-red-500",
    dot: "bg-red-500",
  },
  COMPLETED: {
    label: STUDENT_PROGRESS_STATUS_LABELS.COMPLETED,
    icon: Trophy,
    badge: "bg-violet-100 text-violet-800",
    tile: "bg-violet-50 text-violet-600",
    bar: "bg-violet-500",
    dot: "bg-violet-500",
  },
  NOT_ENROLLED: {
    label: STUDENT_PROGRESS_STATUS_LABELS.NOT_ENROLLED,
    icon: CircleSlash,
    badge: "bg-slate-100 text-slate-600",
    tile: "bg-slate-100 text-slate-500",
    bar: "bg-slate-300",
    dot: "bg-slate-400",
  },
};

export function StudentProgressBadge({
  status,
  className,
}: {
  status: StudentProgressStatus;
  className?: string;
}) {
  const tone = STUDENT_PROGRESS_TONES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tone.badge,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.dot)} aria-hidden />
      {tone.label}
    </span>
  );
}

export function StudentProgressBar({
  percent,
  status,
  className,
  showValue = true,
  subLabel,
}: {
  percent: number;
  status: StudentProgressStatus;
  className?: string;
  showValue?: boolean;
  subLabel?: string;
}) {
  const tone = STUDENT_PROGRESS_TONES[status];
  const clamped = Math.min(100, Math.max(0, percent));

  return (
    <div className={cn("min-w-[120px]", className)}>
      {showValue ? (
        <div className="mb-1 flex items-baseline justify-between gap-2">
          <span className="text-sm font-semibold text-navy">{clamped}%</span>
          {subLabel ? (
            <span className="text-[11px] text-slate-400">{subLabel}</span>
          ) : null}
        </div>
      ) : null}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${clamped}% complete`}
      >
        <div
          className={cn("h-full rounded-full transition-all", tone.bar)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
