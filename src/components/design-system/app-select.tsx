import type { SelectHTMLAttributes } from "react";
import { TextField } from "@mui/material";

type AppSelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function AppSelect({ className, children, ...props }: AppSelectProps) {
  return (
    <TextField
      className={className}
      select
      fullWidth
      size="small"
      slotProps={{ select: { native: true } }}
      {...(props as object)}
    >
      {children}
    </TextField>
  );
}
