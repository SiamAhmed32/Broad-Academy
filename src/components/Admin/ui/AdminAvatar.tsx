import { cn } from "@/lib/utils";

const sizes = {
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
};

function initialsOf(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0];
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

/** Round student/staff avatar that falls back to initials when no image is set. */
export function AdminAvatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}) {
  const base = cn(
    "flex shrink-0 items-center justify-center overflow-hidden rounded-full",
    sizes[size],
    className,
  );

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt={name} className={cn(base, "object-cover")} />
    );
  }

  return (
    <span className={cn(base, "bg-navy/10 font-semibold text-navy")} aria-hidden>
      {initialsOf(name)}
    </span>
  );
}
