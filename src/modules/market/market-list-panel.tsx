import { Refresh, Search, Tune } from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  AppBadge,
  AppStatCard,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
  AppTableRow,
} from "../../components/design-system";
import { FilterBar } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import type { MarketItem, MarketPagination, MarketTrend } from "../../types/market";
import {
  displayItemName,
  displaySourceLabel,
  formatMarketPrice,
  trendBadgeVariant,
} from "./market-utils";

type Props = {
  items: MarketItem[];
  pagination?: MarketPagination;
  search: string;
  category: string;
  trend: "" | MarketTrend;
  pageSize: number;
  categories: string[];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTrendChange: (value: "" | MarketTrend) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onRefresh: () => void;
  isFetching: boolean;
  isRefreshing: boolean;
  nameColumnKey: string;
  searchPlaceholderKey: string;
  listTitleKey: string;
  statTotalKey: string;
};

export function MarketListPanel({
  items,
  pagination,
  search,
  category,
  trend,
  pageSize,
  categories,
  onSearchChange,
  onCategoryChange,
  onTrendChange,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  isFetching,
  isRefreshing,
  nameColumnKey,
  searchPlaceholderKey,
  listTitleKey,
  statTotalKey,
}: Props) {
  const { t, isArabic } = useI18n();
  const dateLocale = isArabic ? "ar-EG" : "en-US";
  const numberLocale = isArabic ? "ar-EG" : "en-US";
  const totalItems = pagination?.totalItems ?? items.length;

  return (
    <Stack spacing={3}>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <AppStatCard title={t(statTotalKey)} value={totalItems} />
        </Grid>
      </Grid>

      <FilterBar>
        <TextField
          size="small"
          placeholder={t(searchPlaceholderKey)}
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          sx={{ flex: 1, minWidth: 220 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          size="small"
          label={t("market.allCategories")}
          value={category}
          onChange={(event) => onCategoryChange(event.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{t("market.allCategories")}</MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat} value={cat}>
              {t(`market.category.${cat}`, cat)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label={t("market.allTrends")}
          value={trend}
          onChange={(event) => onTrendChange(event.target.value as "" | MarketTrend)}
          sx={{ minWidth: 160 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Tune fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        >
          <MenuItem value="">{t("market.allTrends")}</MenuItem>
          <MenuItem value="up">{t("market.trend.up")}</MenuItem>
          <MenuItem value="down">{t("market.trend.down")}</MenuItem>
          <MenuItem value="stable">{t("market.trend.stable")}</MenuItem>
        </TextField>
        <TextField
          select
          size="small"
          label={t("market.pageSize")}
          value={pageSize}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
          sx={{ minWidth: 120 }}
        >
          {[10, 20, 50].map((size) => (
            <MenuItem key={size} value={size}>
              {size}
            </MenuItem>
          ))}
        </TextField>
      </FilterBar>

      <AppTable
        title={t(listTitleKey)}
        actions={
          <Button
            variant="outlined"
            size="small"
            startIcon={isRefreshing ? <CircularProgress size={14} /> : <Refresh fontSize="small" />}
            onClick={onRefresh}
            disabled={isRefreshing}
          >
            {t("market.refresh")}
          </Button>
        }
      >
        <AppTableHead>
          <tr>
            <AppTableHeaderCell>{t(nameColumnKey)}</AppTableHeaderCell>
            <AppTableHeaderCell>{t("market.colCategory")}</AppTableHeaderCell>
            <AppTableHeaderCell>{t("market.colPrice")}</AppTableHeaderCell>
            <AppTableHeaderCell>{t("market.colTrend")}</AppTableHeaderCell>
            <AppTableHeaderCell>{t("market.colSource")}</AppTableHeaderCell>
            <AppTableHeaderCell>{t("market.colRecordedAt")}</AppTableHeaderCell>
          </tr>
        </AppTableHead>
        <tbody>
          {isFetching && !items.length ? (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                <CircularProgress size={24} />
              </TableCell>
            </TableRow>
          ) : items.length ? (
            items.map((item) => (
              <AppTableRow key={item.id}>
                <AppTableCell>{displayItemName(item, isArabic, t)}</AppTableCell>
                <AppTableCell>
                  <AppBadge variant="neutral">
                    {t(`market.category.${item.category || "general"}`, item.category || "general")}
                  </AppBadge>
                </AppTableCell>
                <AppTableCell>{formatMarketPrice(item.price, item.unit, t, numberLocale)}</AppTableCell>
                <AppTableCell>
                  <AppBadge variant={trendBadgeVariant(item.trend)}>{t(`market.trend.${item.trend}`)}</AppBadge>
                </AppTableCell>
                <AppTableCell>
                  <AppBadge variant="neutral">{displaySourceLabel(item.source, t)}</AppBadge>
                </AppTableCell>
                <AppTableCell>{new Date(item.recordedAt).toLocaleString(dateLocale)}</AppTableCell>
              </AppTableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 6, color: "text.secondary" }}>
                {t("market.empty")}
              </TableCell>
            </TableRow>
          )}
        </tbody>
      </AppTable>

      {pagination && pagination.totalPages > 1 ? (
        <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {t("market.page")} {pagination.page} / {pagination.totalPages}
          </Typography>
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, page) => onPageChange(page)}
            color="primary"
            shape="rounded"
          />
        </Stack>
      ) : null}
    </Stack>
  );
}
