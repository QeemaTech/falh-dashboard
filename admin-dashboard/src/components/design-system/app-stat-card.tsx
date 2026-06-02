import type { LucideIcon } from "lucide-react";
import { AppBadge } from "./app-badge";
import { AppCard } from "./app-card";

type AppStatCardProps = {
  title: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  change?: string;
  trend?: "up" | "down" | "neutral";
};

export function AppStatCard({ title, value, hint, icon: Icon, change, trend = "neutral" }: AppStatCardProps) {
  return (
    <AppCard>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--app-text-secondary)]">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--app-text-primary)]">{value}</p>
        </div>
        {Icon ? (
          <div className="flex size-10 items-center justify-center rounded-2xl bg-[var(--app-primary)]/10 text-[var(--app-primary)]">
            <Icon className="size-5" />
          </div>
        ) : null}
      </div>
      {(change || hint) ? (
        <div className="mt-3 flex items-center gap-2">
          {change ? (
            <AppBadge
              variant={trend === "up" ? "success" : trend === "down" ? "danger" : "default"}
            >
              {change}
            </AppBadge>
          ) : null}
          {hint ? <p className="text-xs text-[var(--app-text-secondary)]">{hint}</p> : null}
        </div>
      ) : null}
    </AppCard>
  );
}
