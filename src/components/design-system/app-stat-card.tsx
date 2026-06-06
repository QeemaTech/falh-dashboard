import type { ReactNode } from "react";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { AppBadge } from "./app-badge";

type AppStatCardProps = {
  title: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  change?: string;
  trend?: "up" | "down" | "neutral";
};

export function AppStatCard({ title, value, hint, icon, change, trend = "neutral" }: AppStatCardProps) {
  return (
    <Card>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" spacing={1.5} sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: 0.5, fontWeight: 600 }}>
              {title}
            </Typography>
            <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700, lineHeight: 1.2 }}>
              {value}
            </Typography>
          </Box>
          {icon ? (
            <Box
              sx={{
                width: 36,
                height: 36,
                flexShrink: 0,
                borderRadius: 1.5,
                display: "grid",
                placeItems: "center",
                bgcolor: "primary.main",
                color: "primary.contrastText",
              }}
            >
              {icon}
            </Box>
          ) : null}
        </Stack>
        {change || hint ? (
          <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: "center", flexWrap: "wrap" }}>
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
