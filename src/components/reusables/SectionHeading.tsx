import { cn } from "@/lib/utils";

export default function SectionHeading({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <h2 className="text-3xl font-bold leading-tight tracking-[-0.02em] text-navy sm:text-4xl lg:text-[2.6rem]">
        {title}
      </h2>
      <div className="mt-4 flex items-center gap-2" aria-hidden="true">
        <span className="h-[3px] w-10 rounded-full bg-navy/25" />
        <span className="h-2 w-2 rounded-full bg-btnBg" />
        <span className="h-[3px] w-10 rounded-full bg-navy/25" />
      </div>
    </div>
  );
}
