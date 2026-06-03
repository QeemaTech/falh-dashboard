import type { ButtonHTMLAttributes } from "react";
import { AppButton } from "../design-system";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "outline" | "ghost";
};

export function Button({ className, variant = "default", ...props }: Props) {
  const mappedVariant = variant === "default" ? "primary" : variant;
  return <AppButton className={className} variant={mappedVariant} {...props} />;
}
