import * as React from "react";

import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "secondary" | "success" | "warning" | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  default: "border-transparent bg-accent/10 text-accent",
  secondary: "border-transparent bg-navy/10 text-navy",
  success: "border-transparent bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  warning: "border-transparent bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  outline: "border-slate-200 bg-white text-navy",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        variantClasses[variant],
        className,
      )}
      {...props}
    />
  );
}
