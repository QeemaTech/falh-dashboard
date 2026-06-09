import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AccountBalance, MonetizationOn, Search, Store } from "@mui/icons-material";
import {
  Button,
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
import {
  AppStatCard,
  AppDrawer,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
} from "../../components/design-system";
import { EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  fetchCompanyFinanceDetails,
  fetchFinanceOverview,
  updateCompanyCommissionApi,
  type CompanyFinanceSummary,
} from "../../services/admin-api";
import { toast } from "../../components/ui/sonner";

function formatMoney(amount: number, locale: string, currency: string) {
  return `${currency} ${Number(amount || 0).toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "SUSPENDED" || status === "REJECTED") return "error";
  return "default";
}

export function FinancePage() {
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const currency = t("market.currency");
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [commissionRate, setCommissionRate] = useState("10");

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

  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ["finance-company", selectedCompanyId],
    queryFn: () => fetchCompanyFinanceDetails(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });

  useEffect(() => {
    if (details?.summary?.commissionRate !== undefined) {
      setCommissionRate(String(details.summary.commissionRate));
    }
  }, [details?.summary?.commissionRate, selectedCompanyId]);

  const commissionMutation = useMutation({
    mutationFn: ({ companyId, rate }: { companyId: string; rate: number }) =>
      updateCompanyCommissionApi(companyId, rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-overview"] });
      queryClient.invalidateQueries({ queryKey: ["finance-company", selectedCompanyId] });
      toast.success(t("finance.commissionSaved"));
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : t("finance.commissionSaveFailed"));
    },
  });

  const rows = (data?.items || []) as CompanyFinanceSummary[];
  const totals = data?.totals;

  const statusLabel = (value: string) =>
    t(`companies.status.${value}` as "companies.status.PENDING") || value;

  const orderStatusLabel = (value: string) =>
    t(`orders.status.${value}` as "orders.status.PENDING") || value;

  const selectedRow = useMemo(
    () => rows.find((row) => row.companyId === selectedCompanyId) || null,
    [rows, selectedCompanyId]
  );

  function saveCommission() {
    if (!selectedCompanyId) return;
    const rate = Number(commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast.error(t("finance.commissionInvalid"));
      return;
    }
    commissionMutation.mutate({ companyId: selectedCompanyId, rate });
  }

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
          <AppStatCard
            title={t("finance.statOrders")}
            value={totals?.ordersCount || 0}
            trend="neutral"
          />
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
                onClick={() => setSelectedCompanyId(row.companyId)}
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

      <AppDrawer
        open={Boolean(selectedCompanyId)}
        onClose={() => setSelectedCompanyId(null)}
        title={selectedRow?.companyName || t("finance.detailsTitle")}
        width={520}
      >
        {detailsLoading ? (
          <Stack sx={{ py: 4, alignItems: "center" }}>
            <CircularProgress size={28} />
          </Stack>
        ) : details ? (
          <Stack spacing={2.5}>
            <Stack spacing={1}>
              <Typography variant="body2">
                {t("finance.col.gross")}: {formatMoney(details.summary.grossSales, locale, currency)}
              </Typography>
              <Typography variant="body2">
                {t("finance.col.commission")}: {formatMoney(details.summary.commissionAmount, locale, currency)}
              </Typography>
              <Typography variant="body2">
                {t("finance.col.net")}: {formatMoney(details.summary.netToCompany, locale, currency)}
              </Typography>
              <Typography variant="body2">
                {t("finance.col.orders")}: {details.summary.ordersCount}
              </Typography>
            </Stack>

            <TextField
              label={t("finance.commissionRate")}
              type="number"
              size="small"
              fullWidth
              helperText={t("finance.commissionHint")}
              slotProps={{ htmlInput: { min: 0, max: 100, step: 0.5 } }}
              value={commissionRate}
              onChange={(e) => setCommissionRate(e.target.value)}
            />
            <Button
              variant="contained"
              onClick={saveCommission}
              disabled={commissionMutation.isPending}
            >
              {t("finance.saveCommission")}
            </Button>

            <Typography variant="subtitle2" sx={{ fontWeight: 700, pt: 1 }}>
              {t("finance.ordersBreakdown")}
            </Typography>

            {!details.orders.length ? (
              <Typography variant="body2" color="text.secondary">
                {t("finance.noOrders")}
              </Typography>
            ) : (
              details.orders.map((order) => (
                <Stack
                  key={order.orderId}
                  spacing={0.75}
                  sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}
                >
                  <Stack direction="row" sx={{ justifyContent: "space-between", gap: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      #{order.orderId.slice(0, 8)}
                    </Typography>
                    <Chip size="small" label={orderStatusLabel(order.status)} variant="outlined" />
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {new Date(order.createdAt).toLocaleString(locale)} · {order.customerName}
                  </Typography>
                  {order.items.map((item) => (
                    <Typography key={item.id} variant="body2" color="text.secondary">
                      {item.title} × {item.quantity} {item.unit} — {formatMoney(item.lineTotal, locale, currency)}
                    </Typography>
                  ))}
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t("finance.col.net")}: {formatMoney(order.netToCompany, locale, currency)}
                  </Typography>
                </Stack>
              ))
            )}
          </Stack>
        ) : null}
      </AppDrawer>
    </Stack>
  );
}
