import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Button, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { DetailField, DetailGrid, DetailPageShell, EmptyState } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { fetchCompanyFinanceDetails, updateCompanyCommissionApi } from "../../services/admin-api";
import { toast } from "../../components/ui/sonner";

function formatMoney(amount: number, locale: string, currency: string) {
  return `${currency} ${Number(amount || 0).toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function FinanceDetailPage() {
  const { companyId } = useParams<{ companyId: string }>();
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const currency = t("market.currency");
  const queryClient = useQueryClient();
  const [commissionRate, setCommissionRate] = useState("10");

  const { data: details, isLoading, isError, error } = useQuery({
    queryKey: ["finance-company", companyId],
    queryFn: () => fetchCompanyFinanceDetails(companyId!),
    enabled: Boolean(companyId),
  });

  useEffect(() => {
    if (details?.summary?.commissionRate !== undefined) {
      setCommissionRate(String(details.summary.commissionRate));
    }
  }, [details?.summary?.commissionRate, companyId]);

  const commissionMutation = useMutation({
    mutationFn: (rate: number) => updateCompanyCommissionApi(companyId!, rate),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-overview"] });
      queryClient.invalidateQueries({ queryKey: ["finance-company", companyId] });
      toast.success(t("finance.commissionSaved"));
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : t("finance.commissionSaveFailed"));
    },
  });

  const orderStatusLabel = (value: string) =>
    t(`orders.status.${value}` as "orders.status.PENDING") || value;

  function saveCommission() {
    const rate = Number(commissionRate);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
      toast.error(t("finance.commissionInvalid"));
      return;
    }
    commissionMutation.mutate(rate);
  }

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError || !details) {
    return (
      <EmptyState title={t("finance.loadFailed")} description={(error as Error)?.message} />
    );
  }

  return (
    <DetailPageShell
      title={details.company?.name || t("finance.detailsTitle")}
      subtitle={details.company?.city || undefined}
      backTo="/finance"
      sections={[
        {
          title: t("finance.detailsTitle"),
          content: (
            <Stack spacing={2.5}>
              <DetailGrid>
                <DetailField
                  label={t("finance.col.gross")}
                  value={formatMoney(details.summary.grossSales, locale, currency)}
                />
                <DetailField
                  label={t("finance.col.commission")}
                  value={formatMoney(details.summary.commissionAmount, locale, currency)}
                />
                <DetailField
                  label={t("finance.col.net")}
                  value={formatMoney(details.summary.netToCompany, locale, currency)}
                />
                <DetailField label={t("finance.col.orders")} value={String(details.summary.ordersCount)} />
              </DetailGrid>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ maxWidth: 480 }}>
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
                  sx={{ borderRadius: "8px", alignSelf: { sm: "flex-start" }, mt: { sm: 0.5 } }}
                >
                  {t("finance.saveCommission")}
                </Button>
              </Stack>
            </Stack>
          ),
        },
        {
          title: t("finance.ordersBreakdown"),
          content: !details.orders.length ? (
            <Typography variant="body2" color="text.secondary">
              {t("finance.noOrders")}
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {details.orders.map((order) => (
                <Stack
                  key={order.orderId}
                  spacing={0.75}
                  sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: "8px" }}
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
                      {item.title} × {item.quantity} {item.unit} —{" "}
                      {formatMoney(item.lineTotal, locale, currency)}
                    </Typography>
                  ))}
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t("finance.col.net")}: {formatMoney(order.netToCompany, locale, currency)}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          ),
        },
      ]}
    />
  );
}
