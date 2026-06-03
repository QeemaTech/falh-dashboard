import type { PropsWithChildren, ReactNode } from "react";
import { cn } from "../../utils/cn";

type AppTableProps = PropsWithChildren<{
  title?: string;
  actions?: ReactNode;
  className?: string;
  containerClassName?: string;
}>;

export function AppTable({ title, actions, className, containerClassName, children }: AppTableProps) {
  return (
    <div className={cn("rounded-[20px] border border-[var(--app-border)] bg-[var(--app-card)] p-0 shadow-[var(--app-shadow-soft)]", className)}>
      {(title || actions) ? (
        <div className="flex items-center justify-between gap-2 border-b border-[var(--app-border)] px-4 py-3">
          {title ? <h3 className="text-sm font-semibold text-[var(--app-text-primary)]">{title}</h3> : <span />}
          {actions}
        </div>
      ) : null}
      <div className={cn("overflow-auto", containerClassName)}>
        <table className="w-full text-start text-sm">{children}</table>
      </div>
    </div>
  );
}

export function AppTableHead({ children }: PropsWithChildren) {
  return <thead className="bg-[var(--app-surface-muted)]">{children}</thead>;
}

export function AppTableRow({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <tr className={cn("border-t border-[var(--app-border)]", className)}>{children}</tr>;
}

export function AppTableCell({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <td className={cn("px-3 py-3", className)}>{children}</td>;
}

export function AppTableHeaderCell({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <th className={cn("px-3 py-3 text-start text-xs font-semibold uppercase tracking-wide text-[var(--app-text-secondary)]", className)}>
      {children}
    </th>
  );
}
