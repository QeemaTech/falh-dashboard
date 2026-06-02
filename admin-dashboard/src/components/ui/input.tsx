import type { InputHTMLAttributes } from "react";
import { AppInput } from "../design-system";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <AppInput {...props} />;
}
