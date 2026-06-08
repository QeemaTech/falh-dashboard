import type { ReactNode } from "react";
import {
  CircularProgress,
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
import { useI18n } from "../../hooks/use-i18n";

export type DataTableColumn<T> = {
  key: keyof T;
  label: string;
  render?: (row: T) => ReactNode;
};

type DataTableProps<T extends Record<string, unknown>> = {
  title?: string;
  columns: Array<DataTableColumn<T>>;
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  loadingMessage?: string;
  getRowKey?: (row: T, index: number) => string | number;
  onRowClick?: (row: T) => void;
};

export function DataTable<T extends Record<string, unknown>>({
  title,
  columns,
  data,
  loading,
  emptyMessage = "No records available.",
  loadingMessage,
  getRowKey,
  onRowClick,
}: DataTableProps<T>) {
  const { t } = useI18n();
  const loadingText = loadingMessage || t("common.loading");

  if (loading) {
    return (
      <Paper sx={{ p: 6 }}>
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <CircularProgress size={28} />
          <Typography variant="body2" color="text.secondary">
            {loadingText}
          </Typography>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper sx={{ overflow: "hidden" }}>
      {title ? (
        <Typography
          variant="subtitle1"
          sx={{ px: 2, py: 1.5, fontWeight: 700, borderBottom: 1, borderColor: "divider" }}
        >
          {title}
        </Typography>
      ) : null}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={String(column.key)} sx={{ fontWeight: 700 }}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length ? (
              data.map((row, index) => (
                <TableRow
                  key={getRowKey?.(row, index) ?? index}
                  hover
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  sx={onRowClick ? { cursor: "pointer" } : undefined}
                >
                  {columns.map((column) => (
                    <TableCell key={String(column.key)}>
                      {column.render ? column.render(row) : String(row[column.key] ?? "-")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 6, color: "text.secondary" }}>
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
}
