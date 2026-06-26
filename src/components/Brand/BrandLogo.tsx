import { GraduationCap, Infinity } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  compact?: boolean;
  href?: string;
  inverse?: boolean;
};

export default function BrandLogo({
  className,
  compact = false,
  href = "/",
  inverse = false,
}: BrandLogoProps) {
  return (
    <Link
      href={href}
      aria-label="Broad Academy home"
      className={cn("inline-flex items-center gap-3", className)}
    >
      <span
        className={cn(
          "relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl shadow-lg",
          inverse
            ? "bg-white text-navy shadow-black/10"
            : "bg-gradient-to-br from-btnBg to-[#005fc7] text-white shadow-btnBg/20",
        )}
      >
        <GraduationCap className="h-5 w-5 -translate-y-0.5" strokeWidth={2.2} />
        <Infinity
          className={cn(
            "absolute bottom-1.5 h-3.5 w-3.5",
            inverse ? "text-accent" : "text-[#8cf0d0]",
          )}
          strokeWidth={2.6}
        />
      </span>
      {!compact && (
        <span className="leading-none">
          <span
            className={cn(
              "block text-base font-bold tracking-[-0.03em]",
              inverse ? "text-white" : "text-navy",
            )}
          >
            Broad Academy
          </span>
          <span
            className={cn(
              "mt-1 block text-[9px] font-semibold uppercase tracking-[0.19em]",
              inverse ? "text-white/55" : "text-accent",
            )}
          >
            Grow to infinity
          </span>
        </span>
      )}
    </Link>
  );
}
