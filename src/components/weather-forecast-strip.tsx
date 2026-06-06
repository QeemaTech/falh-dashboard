import {
  Cloud,
  CloudQueue,
  Grain,
  Thunderstorm,
  WbSunny,
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";

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
  sx?: SxProps<Theme>;
};

function WeatherIcon({ day }: { day: ForecastDay }) {
  const code = String(day.conditionCode || "").toLowerCase();
  const iconSx = { fontSize: 36 };

  if (day.isRain || day.isStorm || code.includes("rain") || code.includes("drizzle") || code.includes("thunder")) {
    if (code.includes("thunder") || day.isStorm) {
      return <Thunderstorm sx={{ ...iconSx, color: "info.main" }} />;
    }
    return <Grain sx={{ ...iconSx, color: "info.light" }} />;
  }
  if (code.includes("cloud")) {
    return <CloudQueue sx={{ ...iconSx, color: "warning.light" }} />;
  }
  if (code === "clouds" || code === "mist" || code === "fog" || code === "haze") {
    return <Cloud sx={{ ...iconSx, color: "text.disabled" }} />;
  }
  return <WbSunny sx={{ ...iconSx, color: "warning.main" }} />;
}

export function WeatherForecastStrip({ days, loading, error, sx }: Props) {
  if (loading) {
    return (
      <Paper
        sx={{
          py: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          ...sx,
        }}
      >
        <CircularProgress size={28} />
      </Paper>
    );
  }

  if (error) {
    return (
      <Paper sx={{ px: 2, py: 3, textAlign: "center", ...sx }}>
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      </Paper>
    );
  }

  if (!days.length) {
    return (
      <Paper sx={{ px: 2, py: 3, textAlign: "center", ...sx }}>
        <Typography variant="body2" color="text.secondary">
          —
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ px: 1, py: 2, overflow: "auto", ...sx }}>
      <Stack
        direction="row"
        spacing={0}
        sx={{
          minWidth: "max-content",
          alignItems: "stretch",
          justifyContent: "space-between",
        }}
      >
        {days.map((day) => (
          <Stack
            key={day.date}
            spacing={1}
            sx={{
              flex: 1,
              minWidth: 72,
              px: 1,
              alignItems: "center",
            }}
          >
            <Typography variant="caption" sx={{ color: "text.secondary", textAlign: "center" }}>
              {day.dayName}
            </Typography>
            <Box>
              <WeatherIcon day={day} />
            </Box>
            <Typography variant="caption" sx={{ fontWeight: 600, textAlign: "center" }}>
              {day.tempMax}° / {day.tempMin}°
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Paper>
  );
}
