import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  Inventory2Outlined,
  LocationOnOutlined,
  MailOutlined,
  NotificationsOutlined,
  PaidOutlined,
  PersonOutlined,
  PhoneOutlined,
  ShoppingCartOutlined,
  SmartToyOutlined,
  VerifiedOutlined,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DetailBackButton,
  DetailHero,
  DetailMediaFrame,
  DetailTwoColumn,
  EmptyState,
  InfoRow,
  MetaItem,
  MetricTile,
  MetricsRow,
  SectionCard,
} from "../../components/layout";
import { PermissionGate } from "../../components/permission-gate";
import { useI18n } from "../../hooks/use-i18n";
import {
  activateUserApi,
  assignUserAdminRoleApi,
  fetchAdminRoles,
  fetchUserAdminRole,
  fetchUserDetails,
  suspendUserApi,
} from "../../services/admin-api";
import type { User } from "../../types/dashboard";
import { toast } from "../../components/ui/sonner";
import { resolveAssetUrl } from "../../utils/asset-url";

function statusChipColor(status: User["status"]): "success" | "warning" | "error" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING_VERIFICATION") return "warning";
  if (status === "SUSPENDED") return "error";
  return "default";
}

function userInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adminRoleId, setAdminRoleId] = useState("");
  const [avatarFailed, setAvatarFailed] = useState(false);

  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey: ["user-details", id],
    queryFn: () => fetchUserDetails(id!),
    enabled: Boolean(id),
  });

  const { data: adminRoles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: fetchAdminRoles,
  });

  const { data: userAdminRole } = useQuery({
    queryKey: ["user-admin-role", id],
    queryFn: () => fetchUserAdminRole(id!),
    enabled: Boolean(id && detail?.role === "ADMIN"),
  });

  useEffect(() => {
    if (userAdminRole?.role?.id) setAdminRoleId(userAdminRole.role.id);
  }, [userAdminRole?.role?.id, id]);

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      assignUserAdminRoleApi(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-admin-role", id] });
      toast.success(t("users.adminRoleSaved"));
    },
    onError: (err: unknown) =>
      toast.error(err instanceof Error ? err.message : t("users.adminRoleSaveFailed")),
  });

  const statusMutation = useMutation({
    mutationFn: async ({ userId, action }: { userId: string; action: "activate" | "suspend" }) =>
      action === "activate" ? activateUserApi(userId) : suspendUserApi(userId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["user-details", variables.userId] });
      toast.success(
        variables.action === "activate" ? t("users.activateSuccess") : t("users.suspendSuccess")
      );
    },
  });

  const statusLabel = (value: User["status"]) => t(`users.status.${value}`);
  const roleLabel = (value: User["role"]) => t(`users.role.${value}`);

  if (isLoading) {
    return (
      <Stack sx={{ py: 8, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError || !detail) {
    return <EmptyState title={t("users.loadFailed")} description={(error as Error)?.message} />;
  }

  const avatarSrc =
    detail.profileImage && !avatarFailed ? resolveAssetUrl(detail.profileImage) : null;

  return (
    <Stack spacing={2.5} sx={{ width: "100%", pb: 2 }}>
      <DetailBackButton to="/users" />

      <DetailHero
        media={
          <DetailMediaFrame>
            {avatarSrc ? (
              <Box
                component="img"
                src={avatarSrc}
                alt={detail.name}
                onError={() => setAvatarFailed(true)}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              userInitials(detail.name) || <PersonOutlined />
            )}
          </DetailMediaFrame>
        }
        title={detail.name}
        status={
          <>
            <Chip
              size="small"
              label={roleLabel(detail.role)}
              variant="outlined"
              sx={{ borderRadius: "8px", fontWeight: 700 }}
            />
            <Chip
              size="small"
              label={statusLabel(detail.status)}
              color={statusChipColor(detail.status)}
              sx={{ borderRadius: "8px", fontWeight: 700 }}
            />
            <Chip
              size="small"
              icon={
                detail.isPhoneVerified ? (
                  <VerifiedOutlined sx={{ fontSize: "16px !important" }} />
                ) : undefined
              }
              label={detail.isPhoneVerified ? t("users.phoneVerified") : t("users.phoneNotVerified")}
              variant="outlined"
              color={detail.isPhoneVerified ? "success" : "default"}
              sx={{ borderRadius: "8px", fontWeight: 600 }}
            />
          </>
        }
        meta={
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
            {detail.phone ? (
              <MetaItem icon={<PhoneOutlined sx={{ fontSize: 16 }} />}>{detail.phone}</MetaItem>
            ) : null}
            {detail.email ? (
              <MetaItem icon={<MailOutlined sx={{ fontSize: 16 }} />}>{detail.email}</MetaItem>
            ) : null}
          </Stack>
        }
        actions={
          <PermissionGate permission="users.update">
            <>
              {detail.status !== "ACTIVE" ? (
                <Button
                  variant="contained"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ userId: detail.id, action: "activate" })}
                  sx={{ borderRadius: "8px" }}
                >
                  {t("users.activate")}
                </Button>
              ) : null}
              {detail.status !== "SUSPENDED" ? (
                <Button
                  variant="outlined"
                  color="error"
                  disabled={statusMutation.isPending}
                  onClick={() => statusMutation.mutate({ userId: detail.id, action: "suspend" })}
                  sx={{ borderRadius: "8px" }}
                >
                  {t("users.suspend")}
                </Button>
              ) : null}
            </>
          </PermissionGate>
        }
      />

      <MetricsRow>
        <MetricTile
          label={t("users.stats.orders")}
          value={String(detail.stats.ordersCount)}
          icon={<ShoppingCartOutlined fontSize="small" />}
        />
        <MetricTile
          label={t("users.stats.products")}
          value={String(detail.stats.productsCount)}
          icon={<Inventory2Outlined fontSize="small" />}
        />
        <MetricTile
          label={t("users.stats.ordersTotal")}
          value={`${detail.stats.ordersTotalAmount.toLocaleString(locale)} ${t("market.currency")}`}
          icon={<PaidOutlined fontSize="small" />}
        />
        <MetricTile
          label={t("users.stats.addresses")}
          value={String(detail.stats.addressesCount)}
          icon={<LocationOnOutlined fontSize="small" />}
        />
      </MetricsRow>

      <Box
        sx={{
          display: "grid",
          gap: 1.5,
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
        }}
      >
        <MetricTile
          label={t("users.stats.notifications")}
          value={String(detail.stats.notificationsCount)}
          icon={<NotificationsOutlined fontSize="small" />}
        />
        <MetricTile
          label={t("users.stats.aiChats")}
          value={String(detail.stats.aiConversationsCount)}
          icon={<SmartToyOutlined fontSize="small" />}
        />
      </Box>

      <DetailTwoColumn
        main={
          <>
            <SectionCard title={t("users.detailsTitle")}>
              <InfoRow label={t("users.col.name", "Name")} value={detail.name} />
              {detail.email ? <InfoRow label={t("users.col.email")} value={detail.email} /> : null}
              <InfoRow label={t("users.col.phone")} value={detail.phone} />
              <InfoRow label={t("users.col.role", "Role")} value={roleLabel(detail.role)} />
              <InfoRow label={t("users.col.status", "Status")} value={statusLabel(detail.status)} />
              <InfoRow
                label={t("users.memberSince")}
                value={new Date(detail.createdAt).toLocaleString(locale)}
              />
            </SectionCard>

            {detail.company ? (
              <SectionCard title={t("users.companyProfile")}>
                <InfoRow label={t("users.col.name", "Name")} value={detail.company.name} />
                {detail.company.city ? (
                  <InfoRow label={t("users.col.city", "City")} value={detail.company.city} />
                ) : null}
                <InfoRow
                  label={t("users.col.status", "Status")}
                  value={<Chip label={detail.company.status} size="small" sx={{ borderRadius: "8px" }} />}
                />
                {detail.company.phone ? (
                  <InfoRow label={t("users.col.phone")} value={detail.company.phone} />
                ) : null}
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ mt: 1.5, borderRadius: "8px" }}
                  onClick={() => navigate(`/companies/${detail.company!.id}`)}
                >
                  {t("users.viewCompany", "View company")}
                </Button>
              </SectionCard>
            ) : null}

            {detail.pendingApplication ? (
              <SectionCard title={t("users.pendingApplication")}>
                <InfoRow
                  label={t("users.col.name", "Name")}
                  value={detail.pendingApplication.companyName || detail.pendingApplication.fullName}
                />
                {detail.pendingApplication.city ? (
                  <InfoRow label={t("users.col.city", "City")} value={detail.pendingApplication.city} />
                ) : null}
                <InfoRow
                  label={t("users.col.status", "Status")}
                  value={
                    <Chip
                      label={detail.pendingApplication.status}
                      color="warning"
                      size="small"
                      sx={{ borderRadius: "8px" }}
                    />
                  }
                />
              </SectionCard>
            ) : null}

            <SectionCard title={t("users.recentOrders")}>
              {detail.recentOrders.length ? (
                <Stack spacing={1.25}>
                  {detail.recentOrders.map((order) => (
                    <Box
                      key={order.id}
                      sx={{
                        p: 1.5,
                        borderRadius: "8px",
                        border: 1,
                        borderColor: "divider",
                        cursor: "pointer",
                        transition: "border-color 0.15s ease",
                        "&:hover": { borderColor: "primary.main" },
                      }}
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <Stack
                        direction="row"
                        sx={{ justifyContent: "space-between", alignItems: "flex-start", gap: 1 }}
                      >
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            #{order.id.slice(0, 8)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(order.createdAt).toLocaleString(locale)}
                          </Typography>
                        </Box>
                        <Stack sx={{ alignItems: "flex-end" }}>
                          <Chip
                            label={order.status}
                            size="small"
                            variant="outlined"
                            sx={{ borderRadius: "8px" }}
                          />
                          <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                            {order.total.toLocaleString(locale)} {t("market.currency")}
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("users.noOrders")}
                </Typography>
              )}
            </SectionCard>
          </>
        }
        side={
          detail.role === "ADMIN" ? (
            <SectionCard title={t("users.adminRoleSection")}>
              <PermissionGate permission="users.update">
                <Stack spacing={1.5}>
                  <TextField
                    select
                    size="small"
                    fullWidth
                    label={t("users.adminRole")}
                    value={adminRoleId || userAdminRole?.role?.id || ""}
                    onChange={(e) => setAdminRoleId(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                  >
                    {adminRoles.map((item) => (
                      <MenuItem key={item.id} value={item.id}>
                        {item.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={!adminRoleId || assignRoleMutation.isPending}
                    onClick={() =>
                      assignRoleMutation.mutate({ userId: detail.id, roleId: adminRoleId })
                    }
                    sx={{ alignSelf: "flex-start", borderRadius: "8px" }}
                  >
                    {t("users.saveAdminRole")}
                  </Button>
                  <Typography variant="caption" color="text.secondary">
                    {t("users.adminRoleHint")}
                  </Typography>
                </Stack>
              </PermissionGate>
            </SectionCard>
          ) : undefined
        }
      />
    </Stack>
  );
}
