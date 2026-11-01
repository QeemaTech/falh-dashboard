import type { PropsWithChildren, ReactNode } from "react";
import { Box, Drawer, IconButton, Stack, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Close } from "@mui/icons-material";

type AppDrawerProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
  width?: number | string | Record<string, number | string>;
}>;

export function AppDrawer({
  open,
  onClose,
  title,
  description,
  footer,
  className,
  width = 420,
  children,
}: AppDrawerProps) {
  const theme = useTheme();
  const anchor = theme.direction === "rtl" ? "left" : "right";

  const resolvedWidth =
    typeof width === "object"
      ? width
      : { xs: "100vw", sm: typeof width === "number" ? `${width}px` : width };

  return (
    <Drawer anchor={anchor} open={open} onClose={onClose} className={className}>
      <Box
        sx={{
          width: resolvedWidth,
          maxWidth: "100vw",
          p: 0,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack
          direction="row"
          sx={{
            px: 2.5,
            pt: 2.5,
            pb: 2,
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: 1,
            borderColor: "divider",
            flexShrink: 0,
          }}
        >
          <Stack spacing={0.5}>
            {title ? (
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {title}
              </Typography>
            ) : null}
            {description ? (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            ) : null}
          </Stack>
          <IconButton aria-label="close" onClick={onClose} size="small">
            <Close fontSize="small" />
          </IconButton>
        </Stack>
        <Box sx={{ flex: 1, overflow: "auto", px: 2.5, py: 2 }}>{children}</Box>
        {footer ? (
          <Box sx={{ px: 2.5, py: 2, borderTop: 1, borderColor: "divider", flexShrink: 0 }}>{footer}</Box>
        ) : null}
      </Box>
    </Drawer>
  );
}
