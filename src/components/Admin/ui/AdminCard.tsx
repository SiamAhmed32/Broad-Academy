import { cn } from "@/lib/utils";

export function AdminCard({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function AdminCardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("mb-5", className)}>{children}</div>;
}

export function AdminCardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={cn("text-lg font-semibold text-navy", className)}>{children}</h3>
  );
}
