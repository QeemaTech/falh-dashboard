import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Box, Chip, CircularProgress, Stack, Typography } from "@mui/material";
import { DetailField, DetailGrid, DetailPageShell, EmptyState } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  fetchAdminOrderById,
  type AdminOrderAddress,
  type AdminOrderStatus,
} from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";

const BRAND_GREEN = "#23673A";

function formatAddress(address?: AdminOrderAddress | null) {
  if (!address) return null;
  const parts = [address.street, address.district, address.city].filter(Boolean);
  if (!parts.length) return address.label || null;
  return address.label ? `${address.label} — ${parts.join(", ")}` : parts.join(", ");
}

function formatMoney(amount: number, locale: string, currency: string) {
  return `${currency} ${Number(amount || 0).toLocaleString(locale)}`;
}

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const currency = t("market.currency");

  const statusLabel = (value: AdminOrderStatus) =>
    t(`orders.status.${value}` as "orders.status.PENDING");

  const paymentLabel = (method?: string) => {
    if (!method) return null;
    return t(`orders.payment.${method}` as "orders.payment.CASH");
  };

  const { data: orderDetail, isLoading, isError, error } = useQuery({
    queryKey: ["admin-order-detail", id],
    queryFn: () => fetchAdminOrderById(id!),
    enabled: Boolean(id),
  });

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError || !orderDetail) {
    return (
      <EmptyState
        title={t("orders.loadFailed")}
        description={(error as Error)?.message || t("orders.detail.notFound")}
      />
    );
  }

  return (
    <DetailPageShell
      title={`${t("orders.detailTitle")} #${orderDetail.id.slice(0, 8)}`}
      backTo="/orders"
      status={
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Chip label={statusLabel(orderDetail.status)} size="small" color="primary" variant="outlined" />
          {orderDetail.isPaid ? (
            <Chip label={t("orders.detail.paid")} size="small" color="success" variant="outlined" />
          ) : (
            <Chip label={t("orders.detail.unpaid")} size="small" variant="outlined" />
          )}
        </Stack>
      }
      sections={[
        {
          title: t("orders.detail.sectionOrder"),
          content: (
            <DetailGrid>
              <DetailField label={t("orders.col.id")} value={orderDetail.id} />
              <DetailField
                label={t("orders.col.created")}
                value={new Date(orderDetail.createdAt).toLocaleString(locale)}
              />
              {orderDetail.updatedAt ? (
                <DetailField
                  label={t("orders.detail.updatedAt")}
                  value={new Date(orderDetail.updatedAt).toLocaleString(locale)}
                />
              ) : null}
              <DetailField label={t("orders.detail.notes")} value={orderDetail.notes || "—"} />
            </DetailGrid>
          ),
        },
        {
          title: t("orders.detail.sectionCustomer"),
          content: (
            <DetailGrid>
              <DetailField label={t("orders.col.customer")} value={orderDetail.user?.name} />
              <DetailField label={t("orders.detail.phone")} value={orderDetail.user?.phone} />
              <DetailField label={t("orders.detail.email")} value={orderDetail.user?.email} />
            </DetailGrid>
          ),
        },
        {
          title: t("orders.detail.sectionPayment"),
          content: (
            <DetailGrid>
              <DetailField
                label={t("orders.detail.paymentMethod")}
                value={paymentLabel(orderDetail.paymentMethod)}
              />
              <DetailField
                label={t("orders.detail.subtotal")}
                value={formatMoney(orderDetail.subtotal ?? orderDetail.total, locale, currency)}
              />
              {orderDetail.discount ? (
                <DetailField
                  label={t("orders.detail.discount")}
                  value={formatMoney(orderDetail.discount, locale, currency)}
                />
              ) : null}
              <DetailField
                label={t("orders.col.total")}
                value={formatMoney(orderDetail.total, locale, currency)}
              />
            </DetailGrid>
          ),
        },
        ...(orderDetail.address
          ? [
              {
                title: t("orders.detail.sectionAddress"),
                content: (
                  <DetailGrid columns={{ xs: 1, sm: 1, md: 1 }}>
                    <DetailField
                      label={t("orders.detail.address")}
                      value={formatAddress(orderDetail.address)}
                    />
                  </DetailGrid>
                ),
              },
            ]
          : []),
        {
          title: `${t("orders.detail.sectionItems")} (${orderDetail.items?.length || 0})`,
          content: orderDetail.items?.length ? (
            <Stack spacing={1.25}>
              {orderDetail.items.map((item) => {
                const imagePath = item.product?.images?.[0]?.path;
                const lineTotal = item.price * item.quantity;
                return (
                  <Stack
                    key={item.id}
                    direction="row"
                    spacing={1.5}
                    sx={{
                      p: 1.5,
                      borderRadius: "8px",
                      border: 1,
                      borderColor: "divider",
                    }}
                  >
                    {imagePath ? (
                      <Box
                        component="img"
                        src={resolveAssetUrl(imagePath)}
                        alt={item.title}
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: "8px",
                          objectFit: "cover",
                          flexShrink: 0,
                        }}
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
                    <Typography variant="body2" sx={{ fontWeight: 700, flexShrink: 0 }}>
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
          ),
        },
        ...(orderDetail.statusHistory?.length
          ? [
              {
                title: t("orders.detail.sectionHistory"),
                content: (
                  <Stack spacing={1.25}>
                    {orderDetail.statusHistory.map((entry) => (
                      <Box
                        key={entry.id}
                        sx={{
                          pl: 1.75,
                          py: 0.75,
                          borderLeft: `3px solid ${BRAND_GREEN}`,
                          borderRadius: "0 8px 8px 0",
                          bgcolor: "action.hover",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {statusLabel(entry.status)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block" }}
                        >
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
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
