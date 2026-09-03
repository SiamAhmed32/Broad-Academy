import Image from "next/image";
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
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/10">
        <Image
          src="/logo.jpeg"
          alt=""
          fill
          sizes="44px"
          className="object-cover"
          priority
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
