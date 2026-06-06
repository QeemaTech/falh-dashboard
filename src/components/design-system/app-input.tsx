import { forwardRef, type InputHTMLAttributes } from "react";
import { TextField } from "@mui/material";

type AppInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "color" | "size"> & {
  size?: number;
};

export const AppInput = forwardRef<HTMLInputElement, AppInputProps>(function AppInput(
  { className, min, max, step, size, ...props },
  ref,
) {
  return (
    <TextField
      className={className}
      fullWidth
      size="small"
      inputRef={ref}
      slotProps={{
        htmlInput: { min, max, step, size },
      }}
      {...props}
    />
  );
});
