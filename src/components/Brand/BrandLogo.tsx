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
      className={cn("inline-flex items-center", className)}
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
        // Both words are sized to the same width so they stack as one
        // block, about as tall as the visible mark (the PNG has padding).
        <span className="-ml-px flex flex-col justify-center leading-[0.9]">
          <span
            className={cn(
              "text-[24px] font-bold tracking-[-0.02em]",
              inverse ? "text-white" : "text-navy",
            )}
          >
            Broad
          </span>
          <span
            className={cn(
              "text-[14.9px] font-bold tracking-[-0.02em]",
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
