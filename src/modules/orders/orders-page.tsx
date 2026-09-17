import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DataTable, EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { fetchAdminOrders, type AdminOrder, type AdminOrderStatus } from "../../services/admin-api";

type OrderRow = {
  id: string;
  customer: string;
  status: string;
  total: string;
  createdAt: string;
  actions: string;
};

const ORDER_STATUSES: AdminOrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "DELIVERED", "CANCELLED"];

function formatMoney(amount: number, locale: string, currency: string) {
  return `${currency} ${Number(amount || 0).toLocaleString(locale)}`;
}

export function OrdersPage() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const currency = t("market.currency");
  const [status, setStatus] = useState("");

  const statusLabel = (value: AdminOrderStatus) =>
    t(`orders.status.${value}` as "orders.status.PENDING");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-orders", status],
    queryFn: () =>
      fetchAdminOrders({
        page: 1,
        limit: 50,
        status: status || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  const rows = useMemo<OrderRow[]>(() => {
    const items = (data?.items || []) as AdminOrder[];
    return items.map((order) => ({
      id: order.id,
      customer: order.user?.name || "-",
      status: statusLabel(order.status),
      total: formatMoney(order.total, locale, currency),
      createdAt: new Date(order.createdAt).toLocaleString(locale),
      actions: "",
    }));
  }, [currency, data?.items, locale, t, language]);

  if (isError) {
    return <EmptyState title={t("orders.loadFailed")} description={(error as Error).message} />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader title={t("orders.title")} subtitle={t("orders.subtitle")} />
      <FilterBar>
        <TextField
          select
          label={t("orders.filterStatus")}
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">{t("orders.allStatuses")}</MenuItem>
          {ORDER_STATUSES.map((value) => (
            <MenuItem key={value} value={value}>
              {statusLabel(value)}
            </MenuItem>
          ))}
        </TextField>
      </FilterBar>
      <DataTable<OrderRow>
        title={t("orders.tableTitle")}
        loading={isLoading}
        emptyMessage={t("orders.empty")}
        columns={[
          {
            key: "id",
            label: t("orders.col.id"),
            render: (row) => (
              <Typography variant="body2" sx={{ fontFamily: "monospace", fontSize: "0.8rem" }}>
                {row.id.length > 12 ? `${row.id.slice(0, 8)}…` : row.id}
              </Typography>
            ),
          },
          { key: "customer", label: t("orders.col.customer") },
          { key: "status", label: t("orders.col.status") },
          { key: "total", label: t("orders.col.total") },
          { key: "createdAt", label: t("orders.col.created") },
          {
            key: "actions",
            label: t("orders.col.actions"),
            render: (row) => (
              <Button size="small" onClick={() => navigate(`/orders/${row.id}`)}>
                {t("orders.view")}
              </Button>
            ),
          },
        ]}
        data={rows}
        getRowKey={(row) => row.id}
      />
    </Stack>
  );
}
