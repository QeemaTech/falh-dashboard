import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem, Stack, TextField } from "@mui/material";
import { DataTable, EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { fetchAdminOrders, type AdminOrder } from "../../services/admin-api";

type OrderStatus = AdminOrder["status"];

type OrderRow = {
  id: string;
  customer: string;
  status: string;
  total: string;
  createdAt: string;
};

const ORDER_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "DELIVERED", "CANCELLED"];

export function OrdersPage() {
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const [status, setStatus] = useState("");

  const statusLabel = (value: OrderStatus) =>
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
      status: t(`orders.status.${order.status}` as "orders.status.PENDING"),
      total: `${t("market.currency")} ${Number(order.total || 0).toLocaleString(locale)}`,
      createdAt: new Date(order.createdAt).toLocaleString(locale),
    }));
  }, [data?.items, locale, t]);

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
          { key: "id", label: t("orders.col.id") },
          { key: "customer", label: t("orders.col.customer") },
          { key: "status", label: t("orders.col.status") },
          { key: "total", label: t("orders.col.total") },
          { key: "createdAt", label: t("orders.col.created") },
        ]}
        data={rows}
        getRowKey={(row) => row.id}
      />
    </Stack>
  );
}
