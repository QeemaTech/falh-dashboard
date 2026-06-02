import type { LucideIcon } from "lucide-react";
import { AppStatCard } from "./design-system";

type Props = {
  title: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  change?: string;
  trend?: "up" | "down";
  sparkline?: number[];
};

export function AnalyticsWidget({ title, value, hint, icon: Icon, change, trend = "up", sparkline }: Props) {
  return (
    <div className="relative overflow-hidden rounded-[20px]">
      <AppStatCard title={title} value={value} hint={hint} icon={Icon} change={change || "0.0%"} trend={trend} />
      {sparkline?.length ? (
        <div className="mt-2 px-5 pb-5">
          <div className="flex h-8 items-end gap-1">
          {sparkline.map((point, index) => (
            <span
              key={`${title}-sparkline-${index}`}
              className="w-full rounded-full bg-[#23673A]/25"
              style={{ height: `${Math.max(point, 14)}%` }}
            />
          ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
