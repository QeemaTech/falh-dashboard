import { forwardRef, type InputHTMLAttributes } from "react";
import { AppInput } from "../design-system";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input(props, ref) {
  return <AppInput ref={ref} {...props} />;
});
