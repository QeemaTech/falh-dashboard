import type { PropsWithChildren } from "react";
import { Chip, type ChipProps } from "@mui/material";

type AppBadgeVariant = "default" | "success" | "warning" | "danger" | "neutral";

type AppBadgeProps = PropsWithChildren<{
  variant?: AppBadgeVariant;
  className?: string;
}>;

const colorMap: Record<AppBadgeVariant, ChipProps["color"]> = {
  default: "primary",
  success: "success",
  warning: "warning",
  danger: "error",
  neutral: "default",
};

export function AppBadge({ variant = "default", className, children }: AppBadgeProps) {
  return (
    <Chip
      className={className}
      label={children}
      size="small"
      color={colorMap[variant]}
      variant={variant === "neutral" ? "outlined" : "filled"}
      sx={{ fontWeight: 600 }}
    />
  );
}
