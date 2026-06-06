import type { ReactNode } from "react";
import { Paper, Stack, Typography } from "@mui/material";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <Paper sx={{ p: 5, textAlign: "center" }}>
      <Stack spacing={2} sx={{ alignItems: "center" }}>
        {icon ? (
          <Typography component="div" color="text.secondary">
            {icon}
          </Typography>
        ) : null}
        <Typography variant="h6">{title}</Typography>
        {description ? (
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>
            {description}
          </Typography>
        ) : null}
        {action}
      </Stack>
    </Paper>
  );
}
