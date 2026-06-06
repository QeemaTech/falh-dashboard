import type { HTMLAttributes, PropsWithChildren } from "react";
import { Card, CardContent } from "@mui/material";

type AppCardProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>;

export function AppCard({ children, className, ...props }: AppCardProps) {
  return (
    <Card className={className} {...props}>
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>{children}</CardContent>
    </Card>
  );
}
