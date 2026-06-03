import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../utils/cn";

type AppSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function AppSelect({ className, children, ...props }: AppSelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          "h-11 w-full appearance-none rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 pe-10 text-sm text-[var(--app-text-primary)] shadow-[0_6px_18px_-15px_rgba(15,23,42,0.22)] outline-none transition focus:border-[var(--app-primary)]/45 focus:ring-2 focus:ring-[var(--app-primary)]/15",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute inset-e-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
    </div>
  );
}
