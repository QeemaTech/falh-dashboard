import type { PropsWithChildren, ReactNode } from "react";
import {
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  type TableCellProps,
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
  minWidth?: number | string;
}>;

export function AppTable({
  title,
  actions,
  className,
  children,
  minWidth = 960,
}: AppTableProps) {
  return (
    <Paper
      className={className}
      variant="outlined"
      sx={{ overflow: "hidden", borderRadius: "8px", borderColor: "divider" }}
    >
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
      <TableContainer sx={{ overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth, tableLayout: "auto" }}>
          {children}
        </Table>
      </TableContainer>
    </Paper>
  );
}

export function AppTableHead({ children }: PropsWithChildren) {
  return <TableHead>{children}</TableHead>;
}

export function AppTableRow({
  children,
  className,
  hover = true,
}: PropsWithChildren<{ className?: string; hover?: boolean }>) {
  return (
    <TableRow hover={hover} className={className}>
      {children}
    </TableRow>
  );
}

type AppTableCellProps = PropsWithChildren<{
  className?: string;
  align?: TableCellProps["align"];
  width?: number | string;
  sx?: TableCellProps["sx"];
  colSpan?: number;
}>;

export function AppTableCell({ children, className, align, width, sx, colSpan }: AppTableCellProps) {
  return (
    <TableCell className={className} align={align} colSpan={colSpan} sx={{ width, ...((sx as object) || {}) }}>
      {children}
    </TableCell>
  );
}

export function AppTableHeaderCell({
  children,
  className,
  align,
  width,
  sx,
}: AppTableCellProps) {
  return (
    <TableCell
      className={className}
      align={align}
      sx={{
        width,
        whiteSpace: "nowrap",
        fontWeight: 700,
        fontSize: "0.75rem",
        ...((sx as object) || {}),
      }}
    >
      {children}
    </TableCell>
  );
}

export { TableBody };
