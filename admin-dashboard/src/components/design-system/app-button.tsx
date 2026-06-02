import type { ButtonHTMLAttributes } from "react";
import { cn } from "../../utils/cn";

type AppButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant;
};

export function AppButton({ className, variant = "primary", ...props }: AppButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--app-primary)]/25 disabled:pointer-events-none disabled:opacity-50",
        variant === "primary" &&
          "bg-[var(--app-primary)] text-white shadow-[0_10px_22px_-14px_rgba(35,103,58,0.95)] hover:-translate-y-0.5 hover:bg-[#1e5a31]",
        variant === "secondary" &&
          "bg-[var(--app-secondary)] text-white shadow-[0_10px_22px_-14px_rgba(77,154,91,0.95)] hover:-translate-y-0.5 hover:bg-[#43874f]",
        variant === "outline" &&
          "border border-[var(--app-border)] bg-[var(--app-surface)] text-[var(--app-text-primary)] hover:-translate-y-0.5 hover:bg-[var(--app-hover)]",
        variant === "ghost" &&
          "text-[var(--app-text-secondary)] hover:bg-[var(--app-hover)] hover:text-[var(--app-text-primary)]",
        variant === "danger" && "bg-red-600 text-white shadow-[0_10px_22px_-14px_rgba(220,38,38,0.9)] hover:-translate-y-0.5 hover:bg-red-700",
        className
      )}
      {...props}
    />
  );
}
