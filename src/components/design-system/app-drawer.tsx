import type { PropsWithChildren, ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "../../utils/cn";
import { AppButton } from "./app-button";

type AppDrawerProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
}>;

export function AppDrawer({ open, onClose, title, description, footer, className, children }: AppDrawerProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-[var(--app-overlay)] backdrop-blur-sm" onClick={onClose}>
      <div
        className={cn(
          "absolute inset-e-0 top-0 h-full w-full max-w-md border-s border-[var(--app-border)] bg-[var(--app-surface)] p-5 shadow-[0_24px_55px_-30px_rgba(15,23,42,0.38)]",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            {title ? <h3 className="text-lg font-semibold text-[var(--app-text-primary)]">{title}</h3> : null}
            {description ? <p className="mt-1 text-sm text-[var(--app-text-secondary)]">{description}</p> : null}
          </div>
          <AppButton variant="ghost" className="h-9 w-9 p-0" onClick={onClose}>
            <X className="size-4" />
          </AppButton>
        </div>
        <div className="h-[calc(100%-7rem)] overflow-auto pe-1">{children}</div>
        {footer ? <div className="mt-4 flex items-center gap-2">{footer}</div> : null}
      </div>
    </div>
  );
}
