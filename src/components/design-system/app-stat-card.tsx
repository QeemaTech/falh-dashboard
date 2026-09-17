import type { ReactNode } from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { AppBadge } from "./app-badge";

type IconColor = "primary" | "secondary" | "info" | "warning" | "success" | "error";

type AppStatCardProps = {
  title: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  change?: string;
  trend?: "up" | "down" | "neutral";
  iconColor?: IconColor;
};

export function AppStatCard({
  title,
  value,
  hint,
  icon,
  change,
  trend = "neutral",
  iconColor = "primary",
}: AppStatCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}
            >
              {title}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.75, fontWeight: 700, lineHeight: 1.2 }}>
              {value}
            </Typography>
          </Box>
          {icon ? (
            <Box
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: "8px",
                display: "grid",
                placeItems: "center",
                bgcolor: (theme) => alpha(theme.palette[iconColor].main, theme.palette.mode === "dark" ? 0.16 : 0.1),
                color: `${iconColor}.main`,
              }}
            >
              {icon}
            </Box>
          ) : null}
        </Stack>
        {change || hint ? (
          <Stack direction="row" spacing={1} sx={{ mt: 1.25, alignItems: "center", flexWrap: "wrap" }}>
            {change ? (
              <AppBadge variant={trend === "up" ? "success" : trend === "down" ? "danger" : "default"}>
                {change}
              </AppBadge>
            ) : null}
            {hint ? (
              <Typography variant="caption" color="text.secondary">
                {hint}
              </Typography>
            ) : null}
          </Stack>
        ) : null}
      </CardContent>
    </Card>
  );
}
