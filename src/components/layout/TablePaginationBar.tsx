import { Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useI18n } from "../../hooks/use-i18n";

const PAGE_SIZE_OPTIONS = [10, 20, 50] as const;

type TablePaginationBarProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  onPageSizeChange?: (size: number) => void;
  isFetching?: boolean;
  totalItems?: number;
};

export function TablePaginationBar({
  page,
  totalPages,
  onPageChange,
  pageSize,
  onPageSizeChange,
  isFetching,
  totalItems,
}: TablePaginationBarProps) {
  const { t } = useI18n();
  const safeTotalPages = Math.max(1, totalPages || 1);
  const safePage = Math.min(Math.max(1, page), safeTotalPages);

  if (safeTotalPages <= 1 && totalItems == null && !onPageSizeChange) {
    return null;
  }

  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      sx={{
        justifyContent: "space-between",
        alignItems: { xs: "stretch", sm: "center" },
        pt: 0.5,
      }}
    >
      <Stack direction="row" spacing={1.5} useFlexGap sx={{ alignItems: "center", flexWrap: "wrap" }}>
        <Typography variant="body2" color="text.secondary">
          {t("common.page")} {safePage} {t("common.of")} {safeTotalPages}
          {typeof totalItems === "number" ? ` · ${totalItems} ${t("common.items")}` : ""}
          {isFetching ? ` (${t("common.refreshing")})` : ""}
        </Typography>
        {onPageSizeChange && pageSize != null ? (
          <TextField
            select
            size="small"
            label={t("common.pageSize")}
            value={PAGE_SIZE_OPTIONS.includes(pageSize as (typeof PAGE_SIZE_OPTIONS)[number]) ? pageSize : 20}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            sx={{ minWidth: 110, "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <MenuItem key={size} value={size}>
                {size}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
      </Stack>

      <Stack direction="row" spacing={1} sx={{ justifyContent: { xs: "flex-end", sm: "flex-start" } }}>
        <Button
          variant="outlined"
          size="small"
          disabled={safePage <= 1}
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          sx={{ borderRadius: "8px" }}
        >
          {t("common.previous")}
        </Button>
        <Button
          variant="outlined"
          size="small"
          disabled={safePage >= safeTotalPages}
          onClick={() => onPageChange(safePage + 1)}
          sx={{ borderRadius: "8px" }}
        >
          {t("common.next")}
        </Button>
      </Stack>
    </Stack>
  );
}

export function resolveTotalPages(meta?: { totalPages?: number; total?: number; limit?: number } | null) {
  if (!meta) return 1;
  if (meta.totalPages && meta.totalPages > 0) return meta.totalPages;
  if (meta.total != null && meta.limit) return Math.max(1, Math.ceil(meta.total / meta.limit));
  return 1;
}
