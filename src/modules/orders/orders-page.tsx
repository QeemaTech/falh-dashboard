import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DataTable, EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { AppDrawer } from "../../components/design-system/app-drawer";
import { useI18n } from "../../hooks/use-i18n";
import {
  fetchAdminOrderById,
  fetchAdminOrders,
  type AdminOrder,
  type AdminOrderAddress,
  type AdminOrderStatus,
} from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";

type OrderRow = {
  id: string;
  customer: string;
  status: string;
  total: string;
  createdAt: string;
  actions: string;
};

const ORDER_STATUSES: AdminOrderStatus[] = ["PENDING", "CONFIRMED", "PREPARING", "DELIVERED", "CANCELLED"];

function DetailLine({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Typography variant="body2">
      <Box component="span" sx={{ color: "text.secondary", display: "inline-block", minWidth: 120 }}>
        {label}:
      </Box>{" "}
      {value}
    </Typography>
  );
}

function formatAddress(address?: AdminOrderAddress | null) {
  if (!address) return null;
  const parts = [address.street, address.district, address.city].filter(Boolean);
  if (!parts.length) return address.label || null;
  return address.label ? `${address.label} — ${parts.join(", ")}` : parts.join(", ");
}

function formatMoney(amount: number, locale: string, currency: string) {
  return `${currency} ${Number(amount || 0).toLocaleString(locale)}`;
}

export function OrdersPage() {
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const currency = t("market.currency");
  const [status, setStatus] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const statusLabel = (value: AdminOrderStatus) =>
    t(`orders.status.${value}` as "orders.status.PENDING");

  const paymentLabel = (method?: string) => {
    if (!method) return null;
    const key = `orders.payment.${method}` as "orders.payment.CASH";
    return t(key);
  };

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

  const { data: orderDetail, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-order-detail", selectedOrderId],
    queryFn: () => fetchAdminOrderById(selectedOrderId!),
    enabled: Boolean(selectedOrderId),
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
  }, [currency, data?.items, locale, statusLabel]);

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
              <Button size="small" onClick={() => setSelectedOrderId(row.id)}>
                {t("orders.view")}
              </Button>
            ),
          },
        ]}
        data={rows}
        getRowKey={(row) => row.id}
      />

      <AppDrawer
        open={Boolean(selectedOrderId)}
        onClose={() => setSelectedOrderId(null)}
        title={t("orders.detailTitle")}
        width={520}
      >
        {detailLoading ? (
          <Stack sx={{ py: 6, alignItems: "center" }}>
            <CircularProgress size={28} />
          </Stack>
        ) : orderDetail ? (
          <Stack spacing={2.5} sx={{ px: 2.5, pb: 3 }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Chip label={statusLabel(orderDetail.status)} size="small" color="primary" variant="outlined" />
              {orderDetail.isPaid ? (
                <Chip label={t("orders.detail.paid")} size="small" color="success" variant="outlined" />
              ) : (
                <Chip label={t("orders.detail.unpaid")} size="small" variant="outlined" />
              )}
            </Stack>

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                {t("orders.detail.sectionOrder")}
              </Typography>
              <Stack spacing={0.75}>
                <DetailLine label={t("orders.col.id")} value={orderDetail.id} />
                <DetailLine
                  label={t("orders.col.created")}
                  value={new Date(orderDetail.createdAt).toLocaleString(locale)}
                />
                {orderDetail.updatedAt ? (
                  <DetailLine
                    label={t("orders.detail.updatedAt")}
                    value={new Date(orderDetail.updatedAt).toLocaleString(locale)}
                  />
                ) : null}
                <DetailLine label={t("orders.detail.notes")} value={orderDetail.notes} />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                {t("orders.detail.sectionCustomer")}
              </Typography>
              <Stack spacing={0.75}>
                <DetailLine label={t("orders.col.customer")} value={orderDetail.user?.name} />
                <DetailLine label={t("orders.detail.phone")} value={orderDetail.user?.phone} />
                <DetailLine label={t("orders.detail.email")} value={orderDetail.user?.email} />
              </Stack>
            </Box>

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                {t("orders.detail.sectionPayment")}
              </Typography>
              <Stack spacing={0.75}>
                <DetailLine
                  label={t("orders.detail.paymentMethod")}
                  value={paymentLabel(orderDetail.paymentMethod)}
                />
                <DetailLine
                  label={t("orders.detail.subtotal")}
                  value={formatMoney(orderDetail.subtotal ?? orderDetail.total, locale, currency)}
                />
                {orderDetail.discount ? (
                  <DetailLine
                    label={t("orders.detail.discount")}
                    value={formatMoney(orderDetail.discount, locale, currency)}
                  />
                ) : null}
                <DetailLine
                  label={t("orders.col.total")}
                  value={formatMoney(orderDetail.total, locale, currency)}
                />
              </Stack>
            </Box>

            {orderDetail.address ? (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                    {t("orders.detail.sectionAddress")}
                  </Typography>
                  <DetailLine label={t("orders.detail.address")} value={formatAddress(orderDetail.address)} />
                </Box>
              </>
            ) : null}

            <Divider />

            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                {t("orders.detail.sectionItems")} ({orderDetail.items?.length || 0})
              </Typography>
              {orderDetail.items?.length ? (
                <Stack spacing={1.5}>
                  {orderDetail.items.map((item) => {
                    const imagePath = item.product?.images?.[0]?.path;
                    const lineTotal = item.price * item.quantity;
                    return (
                      <Stack
                        key={item.id}
                        direction="row"
                        spacing={1.5}
                        sx={{
                          p: 1.25,
                          borderRadius: 1,
                          border: 1,
                          borderColor: "divider",
                        }}
                      >
                        {imagePath ? (
                          <Box
                            component="img"
                            src={resolveAssetUrl(imagePath)}
                            alt={item.title}
                            sx={{ width: 48, height: 48, borderRadius: 1, objectFit: "cover", flexShrink: 0 }}
                          />
                        ) : null}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.quantity} × {formatMoney(item.price, locale, currency)}
                            {item.unit ? ` (${item.unit})` : ""}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, flexShrink: 0 }}>
                          {formatMoney(lineTotal, locale, currency)}
                        </Typography>
                      </Stack>
                    );
                  })}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("orders.detail.noItems")}
                </Typography>
              )}
            </Box>

            {orderDetail.statusHistory?.length ? (
              <>
                <Divider />
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>
                    {t("orders.detail.sectionHistory")}
                  </Typography>
                  <Stack spacing={1}>
                    {orderDetail.statusHistory.map((entry) => (
                      <Box
                        key={entry.id}
                        sx={{
                          pl: 1.5,
                          borderLeft: 2,
                          borderColor: "primary.main",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {statusLabel(entry.status)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                          {new Date(entry.createdAt).toLocaleString(locale)}
                        </Typography>
                        {entry.note ? (
                          <Typography variant="caption" color="text.secondary">
                            {entry.note}
                          </Typography>
                        ) : null}
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </>
            ) : null}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ px: 2.5, py: 3 }}>
            {t("orders.detail.notFound")}
          </Typography>
        )}
      </AppDrawer>
    </Stack>
  );
}
