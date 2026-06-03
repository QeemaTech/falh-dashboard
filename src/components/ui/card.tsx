import type { HTMLAttributes, PropsWithChildren } from "react";
import { AppCard } from "../design-system";

type CardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function Card({ children, ...props }: CardProps) {
  return <AppCard {...props}>{children}</AppCard>;
}
