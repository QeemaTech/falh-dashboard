import type { PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

type AppBadgeVariant = "default" | "success" | "warning" | "danger" | "neutral";

type AppBadgeProps = PropsWithChildren<{
  variant?: AppBadgeVariant;
  className?: string;
}>;

export function AppBadge({ variant = "default", className, children }: AppBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        variant === "default" && "bg-[var(--app-primary)]/10 text-[var(--app-primary)]",
        variant === "success" && "bg-emerald-100 text-emerald-700",
        variant === "warning" && "bg-amber-100 text-amber-700",
        variant === "danger" && "bg-red-100 text-red-700",
        variant === "neutral" && "bg-[var(--app-surface-muted)] text-[var(--app-text-secondary)]",
        className
      )}
    >
      {children}
    </span>
  );
}
