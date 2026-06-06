import type { ReactNode } from "react";
import { Box } from "@mui/material";
import { AppStatCard } from "./design-system";

type Props = {
  title: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  change?: string;
  trend?: "up" | "down";
  sparkline?: number[];
};

function MiniSparkline({ points }: { points: number[] }) {
  if (!points.length) return null;
  const max = Math.max(...points, 1);
  const width = 120;
  const height = 28;
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : (index / (points.length - 1)) * width;
    const y = height - (point / max) * (height - 4) - 2;
    return `${x},${y}`;
  });
  const area = `${coords.join(" ")} ${width},${height} 0,${height}`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={28} preserveAspectRatio="none" aria-hidden>
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#23673A" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#23673A" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#spark-fill)" />
      <polyline
        points={coords.join(" ")}
        fill="none"
        stroke="#23673A"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AnalyticsWidget({ title, value, hint, icon, change, trend = "up", sparkline }: Props) {
  return (
    <Box sx={{ overflow: "hidden", borderRadius: 2 }}>
      <AppStatCard title={title} value={value} hint={hint} icon={icon} change={change || "0.0%"} trend={trend} />
      {sparkline?.length ? (
        <Box sx={{ borderTop: 1, borderColor: "divider", px: 2, py: 1 }}>
          <MiniSparkline points={sparkline} />
        </Box>
      ) : null}
    </Box>
  );
}
