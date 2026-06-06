import type { PropsWithChildren } from "react";
import { Paper, Stack } from "@mui/material";

export function FilterBar({ children }: PropsWithChildren) {
  return (
    <Paper sx={{ p: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ alignItems: { sm: "center" }, flexWrap: "wrap" }}
      >
        {children}
      </Stack>
    </Paper>
  );
}
