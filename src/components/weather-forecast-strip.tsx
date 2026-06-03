import { Cloud, CloudRain, CloudSun, Loader2, Sun } from "lucide-react";
import { cn } from "../utils/cn";

export type ForecastDay = {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  conditionCode?: string | null;
  icon?: string | null;
  isRain?: boolean;
  isStorm?: boolean;
};

type Props = {
  days: ForecastDay[];
  loading?: boolean;
  error?: string | null;
  className?: string;
};

function WeatherIcon({ day }: { day: ForecastDay }) {
  const code = String(day.conditionCode || "").toLowerCase();
  const className = "size-9 text-amber-500";

  if (day.isRain || day.isStorm || code.includes("rain") || code.includes("drizzle") || code.includes("thunder")) {
    return <CloudRain className={cn(className, "text-sky-500")} />;
  }
  if (code.includes("cloud")) {
    return <CloudSun className={cn(className, "text-amber-400")} />;
  }
  if (code === "clouds" || code === "mist" || code === "fog" || code === "haze") {
    return <Cloud className={cn(className, "text-slate-400")} />;
  }
  return <Sun className={className} />;
}

export function WeatherForecastStrip({ days, loading, error, className }: Props) {
  if (loading) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-2xl border border-(--app-border) bg-(--app-surface) py-8 shadow-(--app-shadow-soft)",
          className
        )}
      >
        <Loader2 className="size-6 animate-spin text-[#23673A]" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-(--app-border) bg-(--app-surface) px-4 py-6 text-center text-sm text-red-600 shadow-(--app-shadow-soft)",
          className
        )}
      >
        {error}
      </div>
    );
  }

  if (!days.length) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-(--app-border) bg-(--app-surface) px-4 py-6 text-center text-sm text-(--app-text-secondary) shadow-(--app-shadow-soft)",
          className
        )}
      >
        —
      </div>
    );
  }

  return (
    <div
      className={cn(
        "overflow-x-auto rounded-2xl border border-(--app-border) bg-(--app-surface) px-2 py-4 shadow-(--app-shadow-soft)",
        className
      )}
    >
      <div className="flex min-w-max items-stretch justify-between gap-1 sm:min-w-0 sm:gap-0">
        {days.map((day) => (
          <div
            key={day.date}
            className="flex min-w-[4.5rem] flex-1 flex-col items-center gap-2 px-2 sm:min-w-0"
          >
            <p className="text-center text-xs font-medium text-(--app-text-secondary)">{day.dayName}</p>
            <WeatherIcon day={day} />
            <p className="text-center text-xs font-semibold text-(--app-text-primary)">
              {day.tempMax}° / {day.tempMin}°
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
