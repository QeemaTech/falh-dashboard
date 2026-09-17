import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AccountBalance, MonetizationOn, Search, Store } from "@mui/icons-material";
import {
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TableBody,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  AppStatCard,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
} from "../../components/design-system";
import { EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { fetchFinanceOverview, type CompanyFinanceSummary } from "../../services/admin-api";

function formatMoney(amount: number, locale: string, currency: string) {
  return `${currency} ${Number(amount || 0).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "SUSPENDED" || status === "REJECTED") return "error";
  return "default";
}

export function FinancePage() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const currency = t("market.currency");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["finance-overview", debouncedSearch, status],
    queryFn: () =>
      fetchFinanceOverview({
        search: debouncedSearch || undefined,
        status: status || undefined,
      }),
  });

  const rows = (data?.items || []) as CompanyFinanceSummary[];
  const totals = data?.totals;

  const statusLabel = (value: string) =>
    t(`companies.status.${value}` as "companies.status.PENDING") || value;

  if (isLoading && !data) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError) {
    return <EmptyState title={t("finance.loadFailed")} description={(error as Error).message} />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader title={t("finance.title")} subtitle={t("finance.subtitle")} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppStatCard
            title={t("finance.statGross")}
            value={formatMoney(totals?.grossSales || 0, locale, currency)}
            icon={<MonetizationOn fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppStatCard
            title={t("finance.statCommission")}
            value={formatMoney(totals?.commissionAmount || 0, locale, currency)}
            icon={<AccountBalance fontSize="small" />}
            trend="up"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppStatCard
            title={t("finance.statNet")}
            value={formatMoney(totals?.netToCompany || 0, locale, currency)}
            icon={<Store fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppStatCard title={t("finance.statOrders")} value={totals?.ordersCount || 0} trend="neutral" />
        </Grid>
      </Grid>

      <FilterBar>
        <TextField
          size="small"
          placeholder={t("finance.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 280 } }}
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
          label={t("companies.filterStatus")}
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">{t("companies.allStatuses")}</MenuItem>
          <MenuItem value="APPROVED">{t("companies.status.APPROVED")}</MenuItem>
          <MenuItem value="PENDING">{t("companies.status.PENDING")}</MenuItem>
          <MenuItem value="SUSPENDED">{t("companies.status.SUSPENDED")}</MenuItem>
          <MenuItem value="REJECTED">{t("companies.status.REJECTED")}</MenuItem>
        </TextField>
      </FilterBar>

      {!rows.length ? (
        <EmptyState title={t("finance.empty")} description={t("finance.emptyHint")} />
      ) : (
        <AppTable>
          <AppTableHead>
            <tr>
              <AppTableHeaderCell>{t("finance.col.company")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("finance.col.orders")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("finance.col.gross")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("finance.col.commissionRate")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("finance.col.commission")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("finance.col.net")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.status")}</AppTableHeaderCell>
            </tr>
          </AppTableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={row.companyId}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/finance/${row.companyId}`)}
              >
                <AppTableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {row.companyName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.city || "-"}
                  </Typography>
                </AppTableCell>
                <AppTableCell>{row.ordersCount}</AppTableCell>
                <AppTableCell>{formatMoney(row.grossSales, locale, currency)}</AppTableCell>
                <AppTableCell>{row.commissionRate}%</AppTableCell>
                <AppTableCell>{formatMoney(row.commissionAmount, locale, currency)}</AppTableCell>
                <AppTableCell>{formatMoney(row.netToCompany, locale, currency)}</AppTableCell>
                <AppTableCell>
                  <Chip
                    size="small"
                    label={statusLabel(row.companyStatus)}
                    color={statusChipColor(row.companyStatus)}
                    variant="outlined"
                  />
                </AppTableCell>
              </TableRow>
            ))}
          </TableBody>
        </AppTable>
      )}
    </Stack>
  );
}
