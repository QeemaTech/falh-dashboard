import type { PropsWithChildren, ReactNode } from "react";
import { Stack, Typography } from "@mui/material";

type PageSectionProps = PropsWithChildren<{
  title?: string;
  action?: ReactNode;
}>;

export function PageSection({ title, action, children }: PageSectionProps) {
  return (
    <Stack spacing={2}>
      {title || action ? (
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
          {title ? (
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          ) : (
            <span />
          )}
          {action}
        </Stack>
      ) : null}
      {children}
    </Stack>
  );
}
