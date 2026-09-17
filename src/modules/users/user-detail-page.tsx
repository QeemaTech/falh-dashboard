import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  CalendarMonth,
  Email,
  Inventory2,
  LocationOn,
  Notifications,
  Paid,
  Person,
  Phone,
  ShoppingCart,
  SmartToy,
} from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DetailPageShell, EmptyState } from "../../components/layout";
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

function InfoItem({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
      <Box
        sx={{
          width: 40,
          height: 40,
          flexShrink: 0,
          borderRadius: "8px",
          bgcolor: "action.hover",
          color: "primary.main",
          display: "grid",
          placeItems: "center",
        }}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.3 }}>
          {label}
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: "break-word" }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}

function MiniStat({
  icon,
  label,
  value,
  accent,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        height: "100%",
        borderRadius: "8px",
        bgcolor: "background.paper",
        borderColor: "divider",
      }}
    >
      <Stack spacing={1}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: "8px",
            bgcolor: `${accent}22`,
            color: accent,
            display: "grid",
            placeItems: "center",
          }}
        >
          {icon}
        </Box>
        <Box>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", fontWeight: 600, letterSpacing: 0.3, lineHeight: 1.3 }}
          >
            {label}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2, mt: 0.25 }}>
            {value}
          </Typography>
        </Box>
      </Stack>
    </Paper>
  );
}

export function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const queryClient = useQueryClient();
  const [adminRoleId, setAdminRoleId] = useState("");

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
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError || !detail) {
    return (
      <EmptyState title={t("users.loadFailed")} description={(error as Error)?.message} />
    );
  }

  return (
    <DetailPageShell
      title={detail.name}
      backTo="/users"
      status={
        <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75 }}>
          <Chip label={roleLabel(detail.role)} size="small" variant="outlined" />
          <Chip label={statusLabel(detail.status)} color={statusChipColor(detail.status)} size="small" />
        </Stack>
      }
      actions={
        <PermissionGate permission="users.update">
          <Stack direction="row" spacing={1}>
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
          </Stack>
        </PermissionGate>
      }
      headerExtra={
        <Stack direction="row" spacing={2} sx={{ alignItems: "center", mt: 1 }}>
          <Avatar
            sx={{
              width: 48,
              height: 48,
              bgcolor: "primary.main",
              color: "primary.contrastText",
              fontWeight: 700,
              borderRadius: "8px",
            }}
          >
            {userInitials(detail.name) || <Person />}
          </Avatar>
          <Chip
            label={detail.isPhoneVerified ? t("users.phoneVerified") : t("users.phoneNotVerified")}
            size="small"
            variant="outlined"
            color={detail.isPhoneVerified ? "success" : "default"}
          />
        </Stack>
      }
      sections={[
        {
          title: t("users.detailsTitle"),
          content: (
            <Stack spacing={2}>
              {detail.email ? (
                <InfoItem icon={<Email fontSize="small" />} label={t("users.col.email")} value={detail.email} />
              ) : null}
              <InfoItem icon={<Phone fontSize="small" />} label={t("users.col.phone")} value={detail.phone} />
              <InfoItem
                icon={<CalendarMonth fontSize="small" />}
                label={t("users.memberSince")}
                value={new Date(detail.createdAt).toLocaleString(locale)}
              />
            </Stack>
          ),
        },
        ...(detail.role === "ADMIN"
          ? [
              {
                title: t("users.adminRoleSection"),
                content: (
                  <PermissionGate permission="users.update">
                    <Stack spacing={1.5} sx={{ maxWidth: 420 }}>
                      <TextField
                        select
                        size="small"
                        fullWidth
                        label={t("users.adminRole")}
                        value={adminRoleId || userAdminRole?.role?.id || ""}
                        onChange={(e) => setAdminRoleId(e.target.value)}
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
                ),
              },
            ]
          : []),
        {
          title: t("users.statsSection"),
          content: (
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6, md: 4 }}>
                <MiniStat
                  icon={<ShoppingCart sx={{ fontSize: 18 }} />}
                  label={t("users.stats.orders")}
                  value={String(detail.stats.ordersCount)}
                  accent="#4caf50"
                />
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <MiniStat
                  icon={<Inventory2 sx={{ fontSize: 18 }} />}
                  label={t("users.stats.products")}
                  value={String(detail.stats.productsCount)}
                  accent="#2196f3"
                />
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <MiniStat
                  icon={<Paid sx={{ fontSize: 18 }} />}
                  label={t("users.stats.ordersTotal")}
                  value={`${detail.stats.ordersTotalAmount.toLocaleString(locale)} ${t("market.currency")}`}
                  accent="#ff9800"
                />
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <MiniStat
                  icon={<LocationOn sx={{ fontSize: 18 }} />}
                  label={t("users.stats.addresses")}
                  value={String(detail.stats.addressesCount)}
                  accent="#9c27b0"
                />
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <MiniStat
                  icon={<Notifications sx={{ fontSize: 18 }} />}
                  label={t("users.stats.notifications")}
                  value={String(detail.stats.notificationsCount)}
                  accent="#00bcd4"
                />
              </Grid>
              <Grid size={{ xs: 6, md: 4 }}>
                <MiniStat
                  icon={<SmartToy sx={{ fontSize: 18 }} />}
                  label={t("users.stats.aiChats")}
                  value={String(detail.stats.aiConversationsCount)}
                  accent="#e91e63"
                />
              </Grid>
            </Grid>
          ),
        },
        ...(detail.pendingApplication
          ? [
              {
                title: t("users.pendingApplication"),
                content: (
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {detail.pendingApplication.companyName || detail.pendingApplication.fullName}
                    </Typography>
                    {detail.pendingApplication.city ? (
                      <Typography variant="body2" color="text.secondary">
                        {detail.pendingApplication.city}
                      </Typography>
                    ) : null}
                    <Chip
                      label={detail.pendingApplication.status}
                      color="warning"
                      size="small"
                      sx={{ alignSelf: "flex-start" }}
                    />
                  </Stack>
                ),
              },
            ]
          : []),
        ...(detail.company
          ? [
              {
                title: t("users.companyProfile"),
                content: (
                  <Stack spacing={1}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {detail.company.name}
                    </Typography>
                    {detail.company.city ? (
                      <Typography variant="body2" color="text.secondary">
                        {detail.company.city}
                      </Typography>
                    ) : null}
                    <Chip label={detail.company.status} size="small" sx={{ alignSelf: "flex-start" }} />
                  </Stack>
                ),
              },
            ]
          : []),
        {
          title: t("users.recentOrders"),
          content: detail.recentOrders.length ? (
            <Stack spacing={1}>
              {detail.recentOrders.map((order) => (
                <Paper
                  key={order.id}
                  variant="outlined"
                  sx={{ p: 1.5, borderRadius: "8px", borderColor: "divider" }}
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
                      <Chip label={order.status} size="small" variant="outlined" />
                      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
                        {order.total.toLocaleString(locale)} {t("market.currency")}
                      </Typography>
                    </Stack>
                  </Stack>
                </Paper>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary">
              {t("users.noOrders")}
            </Typography>
          ),
        },
      ]}
    />
  );
}
