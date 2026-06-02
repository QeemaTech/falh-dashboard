import type { InputHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type AppInputProps = InputHTMLAttributes<HTMLInputElement>;

export function AppInput({ className, ...props }: AppInputProps) {
  return (
    <input
      className={cn(
        "h-11 w-full rounded-[14px] border border-[var(--app-border)] bg-[var(--app-surface)] px-3.5 text-sm text-[var(--app-text-primary)] shadow-[0_6px_18px_-15px_rgba(15,23,42,0.22)] outline-none transition focus:border-[var(--app-primary)]/45 focus:ring-2 focus:ring-[var(--app-primary)]/15",
        className
      )}
      {...props}
    />
  );
}
