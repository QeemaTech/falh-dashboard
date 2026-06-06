import type { PropsWithChildren, ReactNode } from "react";
import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

type AppTableProps = PropsWithChildren<{
  title?: string;
  actions?: ReactNode;
  className?: string;
  containerClassName?: string;
}>;

export function AppTable({ title, actions, className, children }: AppTableProps) {
  return (
    <Paper className={className} sx={{ overflow: "hidden" }}>
      {title || actions ? (
        <Stack
          direction="row"
          sx={{
            px: 2,
            py: 1.5,
            borderBottom: 1,
            borderColor: "divider",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {title ? (
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {title}
            </Typography>
          ) : (
            <span />
          )}
          {actions}
        </Stack>
      ) : null}
      <TableContainer>
        <Table size="small">{children}</Table>
      </TableContainer>
    </Paper>
  );
}

export function AppTableHead({ children }: PropsWithChildren) {
  return <TableHead>{children}</TableHead>;
}

export function AppTableRow({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <TableRow className={className}>{children}</TableRow>;
}

export function AppTableCell({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <TableCell className={className}>{children}</TableCell>;
}

export function AppTableHeaderCell({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <TableCell className={className} sx={{ fontWeight: 700, textTransform: "uppercase", fontSize: 12 }}>
      {children}
    </TableCell>
  );
}

export { TableBody };
