import type { PropsWithChildren, ReactNode } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { Close } from "@mui/icons-material";

type AppModalProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  footer?: ReactNode;
  className?: string;
}>;

export function AppModal({ open, onClose, title, description, footer, className, children }: AppModalProps) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md" className={className}>
      <DialogTitle sx={{ pr: 6 }}>
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <Stack spacing={0.5}>
            {title ? <Typography variant="h6">{title}</Typography> : null}
            {description ? (
              <Typography variant="body2" color="text.secondary">
                {description}
              </Typography>
            ) : null}
          </Stack>
          <IconButton aria-label="close" onClick={onClose} sx={{ mt: -0.5 }}>
            <Close fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>{children}</DialogContent>
      {footer ? <DialogActions sx={{ px: 3, py: 2 }}>{footer}</DialogActions> : null}
    </Dialog>
  );
}
