import { cn } from "@/lib/utils";

type AdminFieldProps = {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

export function AdminField({ label, hint, error, children, className }: AdminFieldProps) {
  return (
    <label className={cn("block space-y-1.5", className)}>
      <span className="text-sm font-medium text-navy">{label}</span>
      {children}
      {hint && !error ? (
        <span className="block text-xs text-slate-500">{hint}</span>
      ) : null}
      {error ? <span className="block text-xs text-red-600">{error}</span> : null}
    </label>
  );
}

const invalidFieldClass =
  "border-red-400 focus:border-red-500 focus:ring-red-100 aria-invalid:border-red-400";

export function AdminInput({
  className,
  invalid,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-navy outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20",
        invalid && invalidFieldClass,
        className,
      )}
      {...props}
    />
  );
}

export function AdminTextarea({
  className,
  invalid,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "min-h-[120px] w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-navy outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20",
        invalid && invalidFieldClass,
        className,
      )}
      {...props}
    />
  );
}

export function AdminSelect({
  className,
  children,
  invalid,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-navy outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20",
        invalid && invalidFieldClass,
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
