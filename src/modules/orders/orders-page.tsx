import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  EmptyState,
  FilterBar,
  PageHeader,
  TablePaginationBar,
  TableRowActions,
  resolveTotalPages,
} from "../../components/layout";
import { PermissionGate } from "../../components/permission-gate";
import { toast } from "../../components/ui/sonner";
import { useI18n } from "../../hooks/use-i18n";
import {
  fetchAdminOrders,
  updateAdminOrderStatusApi,
  type AdminOrder,
  type AdminOrderStatus,
} from "../../services/admin-api";
import { getApiErrorMessage } from "../../utils/api-error";
import { ORDER_STATUSES, OrderStatusSelect } from "./order-status-select";

type OrderRow = {
  id: string;
  customer: string;
  status: AdminOrderStatus;
  total: string;
  createdAt: string;
  actions: string;
};

function formatMoney(amount: number, locale: string, currency: string) {
  return `${currency} ${Number(amount || 0).toLocaleString(locale)}`;
}

export function OrdersPage() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const currency = t("market.currency");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [status, pageSize]);

  const statusLabel = (value: AdminOrderStatus) =>
    t(`orders.status.${value}` as "orders.status.PENDING");

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["admin-orders", status, page, pageSize],
    queryFn: () =>
      fetchAdminOrders({
        page,
        limit: pageSize,
        status: status || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    placeholderData: (previousData) => previousData,
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, nextStatus }: { orderId: string; nextStatus: AdminOrderStatus }) =>
      updateAdminOrderStatusApi(orderId, nextStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      queryClient.invalidateQueries({ queryKey: ["admin-order-detail"] });
      toast.success(t("orders.statusUpdated"));
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, t("orders.statusUpdateFailed"))),
  });

  const rows = useMemo<OrderRow[]>(() => {
    const items = (data?.items || []) as AdminOrder[];
    return items.map((order) => ({
      id: order.id,
      customer: order.user?.name || "-",
      status: order.status,
      total: formatMoney(order.total, locale, currency),
      createdAt: new Date(order.createdAt).toLocaleString(locale),
      actions: "",
    }));
  }, [currency, data?.items, locale]);

  const totalPages = resolveTotalPages(data?.meta);

  if (isError) {
    return <EmptyState title={t("orders.loadFailed")} description={(error as Error).message} />;
  }

  return (
    <Stack spacing={2.5}>
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
          {
            key: "status",
            label: t("orders.col.status"),
            render: (row) => (
              <PermissionGate
                permission="orders.update"
                fallback={<Chip size="small" label={statusLabel(row.status)} variant="outlined" />}
              >
                <OrderStatusSelect
                  value={row.status}
                  disabled={statusMutation.isPending}
                  label={statusLabel}
                  onChange={(nextStatus) =>
                    statusMutation.mutate({ orderId: row.id, nextStatus })
                  }
                />
              </PermissionGate>
            ),
          },
          { key: "total", label: t("orders.col.total") },
          { key: "createdAt", label: t("orders.col.created") },
          {
            key: "actions",
            label: t("orders.col.actions"),
            render: (row) => (
              <TableRowActions
                onView={() => navigate(`/orders/${row.id}`)}
                onEdit={() => navigate(`/orders/${row.id}`)}
              />
            ),
          },
        ]}
        data={rows}
        getRowKey={(row) => row.id}
      />
      {rows.length > 0 || totalPages > 1 ? (
        <TablePaginationBar
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          isFetching={isFetching}
          totalItems={data?.meta?.total}
        />
      ) : null}
    </Stack>
  );
}
