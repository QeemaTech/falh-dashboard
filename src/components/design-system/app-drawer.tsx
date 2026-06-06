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
}>;

export function AppDrawer({ open, onClose, title, description, footer, className, children }: AppDrawerProps) {
  const theme = useTheme();
  const anchor = theme.direction === "rtl" ? "left" : "right";

  return (
    <Drawer anchor={anchor} open={open} onClose={onClose} className={className}>
      <Box sx={{ width: { xs: "100vw", sm: 420 }, p: 2.5, height: "100%", display: "flex", flexDirection: "column" }}>
        <Stack direction="row" sx={{ mb: 2, justifyContent: "space-between", alignItems: "flex-start" }}>
          <Stack spacing={0.5}>
            {title ? <Typography variant="h6">{title}</Typography> : null}
            {description ? (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            ) : null}
          </Stack>
          <IconButton aria-label="close" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>
        <Box sx={{ flex: 1, overflow: "auto" }}>{children}</Box>
        {footer ? <Box sx={{ pt: 2 }}>{footer}</Box> : null}
      </Box>
    </Drawer>
  );
}
