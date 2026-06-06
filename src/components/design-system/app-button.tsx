import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Button as MuiButton, type ButtonProps as MuiButtonProps } from "@mui/material";

type AppButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";

type AppButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & {
  variant?: AppButtonVariant;
  children?: ReactNode;
};

const variantMap: Record<AppButtonVariant, Pick<MuiButtonProps, "variant" | "color">> = {
  primary: { variant: "contained", color: "primary" },
  secondary: { variant: "contained", color: "secondary" },
  outline: { variant: "outlined", color: "primary" },
  ghost: { variant: "text", color: "inherit" },
  danger: { variant: "contained", color: "error" },
};

export function AppButton({ className, variant = "primary", children, type = "button", ...props }: AppButtonProps) {
  const mapped = variantMap[variant];
  return (
    <MuiButton className={className} type={type} {...mapped} {...props}>
      {children}
    </MuiButton>
  );
}
