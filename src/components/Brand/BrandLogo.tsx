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
      className={cn("inline-flex items-center gap-2.5", className)}
    >
      <span className="relative h-14 w-14 shrink-0 overflow-hidden">
        <Image
          src="/logo.png"
          alt=""
          fill
          sizes="56px"
          className="object-contain"
          priority
        />
      </span>
      {!compact && (
        <span className="flex flex-col justify-center leading-none">
          <span
            className={cn(
              "text-[12px] font-semibold tracking-[0.01em]",
              inverse ? "text-white/80" : "text-navy/70",
            )}
          >
            Broad
          </span>
          <span
            className={cn(
              "mt-0.5 text-[1.15rem] font-extrabold tracking-[-0.03em]",
              inverse ? "text-white" : "text-navy",
            )}
          >
            Academy
          </span>
        </span>
      )}
    </Link>
  );
}
