import type { HTMLAttributes, PropsWithChildren } from "react";
import { cn } from "../../utils/cn";

type AppCardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function AppCard({ children, className, ...props }: AppCardProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-[var(--app-border)] bg-[var(--app-card)] p-5 shadow-[var(--app-shadow-soft)] transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
