import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
  Visibility,
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
import { AppDrawer } from "../../components/design-system";
import { DataTable, EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { PermissionGate } from "../../components/permission-gate";
import {
  activateUserApi,
  assignUserAdminRoleApi,
  fetchAdminRoles,
  fetchUserAdminRole,
  fetchUserDetails,
  fetchUsers,
  suspendUserApi,
} from "../../services/admin-api";
import type { User } from "../../types/dashboard";
import { toast } from "../../components/ui/sonner";

type UserRow = User & Record<string, unknown>;

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
          borderRadius: 2,
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
        borderRadius: 2.5,
        bgcolor: "background.paper",
        borderColor: "divider",
        transition: "border-color 0.2s",
        "&:hover": { borderColor: accent },
      }}
    >
      <Stack spacing={1}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 1.5,
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

function SectionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Stack spacing={1.5}>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.2 }}>
        {title}
      </Typography>
      {children}
    </Stack>
  );
}

export function UsersPage() {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const locale = language === "ar" ? "ar-EG" : "en-US";

  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adminRoleId, setAdminRoleId] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", status, role, search],
    queryFn: () =>
      fetchUsers({
        page: 1,
        limit: 50,
        search: search || undefined,
        status: status || undefined,
        role: role || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["user-details", selectedId],
    queryFn: () => fetchUserDetails(selectedId!),
    enabled: Boolean(selectedId),
  });

  const { data: adminRoles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: fetchAdminRoles,
  });

  const { data: userAdminRole } = useQuery({
    queryKey: ["user-admin-role", selectedId],
    queryFn: () => fetchUserAdminRole(selectedId!),
    enabled: Boolean(selectedId && detail?.role === "ADMIN"),
  });

  useEffect(() => {
    if (userAdminRole?.role?.id) {
      setAdminRoleId(userAdminRole.role.id);
    }
  }, [userAdminRole?.role?.id, selectedId]);

  const assignRoleMutation = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      assignUserAdminRoleApi(userId, roleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-admin-role", selectedId] });
      toast.success(t("users.adminRoleSaved"));
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : t("users.adminRoleSaveFailed")),
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

  const rows = useMemo<UserRow[]>(() => (data?.users ?? []) as UserRow[], [data?.users]);

  if (isError) {
    return (
      <EmptyState
        title={t("users.loadFailed")}
        description={(error as Error).message}
      />
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader title={t("users.title")} subtitle={t("users.subtitle")} />

      <FilterBar>
        <TextField
          size="small"
          label={t("users.filter.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 240, flex: 1 }}
        />
        <TextField
          select
          label={t("users.filter.status")}
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">{t("users.filter.allStatuses")}</MenuItem>
          <MenuItem value="ACTIVE">{t("users.status.ACTIVE")}</MenuItem>
          <MenuItem value="SUSPENDED">{t("users.status.SUSPENDED")}</MenuItem>
          <MenuItem value="PENDING_VERIFICATION">{t("users.status.PENDING_VERIFICATION")}</MenuItem>
        </TextField>
        <TextField
          select
          label={t("users.filter.role")}
          size="small"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{t("users.filter.allRoles")}</MenuItem>
          <MenuItem value="USER">{t("users.role.USER")}</MenuItem>
          <MenuItem value="COMPANY">{t("users.role.COMPANY")}</MenuItem>
          <MenuItem value="ADMIN">{t("users.role.ADMIN")}</MenuItem>
        </TextField>
      </FilterBar>

      <DataTable<UserRow>
        title={t("users.listTitle")}
        loading={isLoading}
        loadingMessage={t("common.loading")}
        emptyMessage={t("users.empty")}
        getRowKey={(row) => row.id}
        columns={[
          {
            key: "name",
            label: t("users.col.name"),
            render: (row) => (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {row.name}
              </Typography>
            ),
          },
          { key: "email", label: t("users.col.email"), render: (row) => row.email || "-" },
          { key: "phone", label: t("users.col.phone") },
          {
            key: "role",
            label: t("users.col.role"),
            render: (row) => (
              <Chip label={roleLabel(row.role)} size="small" variant="outlined" />
            ),
          },
          {
            key: "status",
            label: t("users.col.status"),
            render: (row) => (
              <Chip label={statusLabel(row.status)} color={statusChipColor(row.status)} size="small" />
            ),
          },
          {
            key: "id",
            label: t("users.col.actions"),
            render: (row) => (
              <Button
                size="small"
                startIcon={<Visibility fontSize="small" />}
                onClick={() => setSelectedId(row.id)}
              >
                {t("users.view")}
              </Button>
            ),
          },
        ]}
        data={rows}
      />

      <AppDrawer
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={t("users.detailsTitle")}
        description={detail?.name}
        width={480}
        footer={
          detail && selectedId ? (
            <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
              <PermissionGate permission="users.update">
                {detail.status !== "ACTIVE" ? (
                  <Button
                    variant="contained"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ userId: selectedId, action: "activate" })}
                  >
                    {t("users.activate")}
                  </Button>
                ) : null}
                {detail.status !== "SUSPENDED" ? (
                  <Button
                    variant="outlined"
                    color="error"
                    disabled={statusMutation.isPending}
                    onClick={() => statusMutation.mutate({ userId: selectedId, action: "suspend" })}
                  >
                    {t("users.suspend")}
                  </Button>
                ) : null}
              </PermissionGate>
            </Stack>
          ) : undefined
        }
      >
        {detailLoading ? (
          <Stack sx={{ py: 4, alignItems: "center" }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {t("common.loading")}
            </Typography>
          </Stack>
        ) : null}

        {detail ? (
          <Stack spacing={3}>
            <Paper
              variant="outlined"
              sx={{
                p: 2.5,
                borderRadius: 3,
                background: (theme) =>
                  theme.palette.mode === "dark"
                    ? `linear-gradient(135deg, ${theme.palette.primary.dark}33 0%, ${theme.palette.background.paper} 60%)`
                    : `linear-gradient(135deg, ${theme.palette.primary.light}22 0%, ${theme.palette.background.paper} 60%)`,
                borderColor: "divider",
              }}
            >
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    fontWeight: 700,
                    fontSize: "1.1rem",
                  }}
                >
                  {userInitials(detail.name) || <Person />}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {detail.name}
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", gap: 0.75, mt: 1 }}>
                    <Chip label={roleLabel(detail.role)} size="small" variant="outlined" />
                    <Chip
                      label={statusLabel(detail.status)}
                      color={statusChipColor(detail.status)}
                      size="small"
                    />
                    <Chip
                      label={
                        detail.isPhoneVerified ? t("users.phoneVerified") : t("users.phoneNotVerified")
                      }
                      size="small"
                      variant="outlined"
                      color={detail.isPhoneVerified ? "success" : "default"}
                    />
                  </Stack>
                </Box>
              </Stack>
            </Paper>

            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: "divider" }}>
              <Stack spacing={2}>
                {detail.email ? (
                  <InfoItem
                    icon={<Email fontSize="small" />}
                    label={t("users.col.email")}
                    value={detail.email}
                  />
                ) : null}
                <InfoItem
                  icon={<Phone fontSize="small" />}
                  label={t("users.col.phone")}
                  value={detail.phone}
                />
                <InfoItem
                  icon={<CalendarMonth fontSize="small" />}
                  label={t("users.memberSince")}
                  value={new Date(detail.createdAt).toLocaleString(locale)}
                />
              </Stack>
            </Paper>

            {detail.role === "ADMIN" ? (
              <PermissionGate permission="users.update">
                <SectionBlock title={t("users.adminRoleSection")}>
                  <Stack spacing={1.5}>
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
                      sx={{ alignSelf: "flex-start" }}
                    >
                      {t("users.saveAdminRole")}
                    </Button>
                    <Typography variant="caption" color="text.secondary">
                      {t("users.adminRoleHint")}
                    </Typography>
                  </Stack>
                </SectionBlock>
              </PermissionGate>
            ) : null}

            <SectionBlock title={t("users.statsSection")}>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 6 }}>
                  <MiniStat
                    icon={<ShoppingCart sx={{ fontSize: 18 }} />}
                    label={t("users.stats.orders")}
                    value={String(detail.stats.ordersCount)}
                    accent="#4caf50"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <MiniStat
                    icon={<Inventory2 sx={{ fontSize: 18 }} />}
                    label={t("users.stats.products")}
                    value={String(detail.stats.productsCount)}
                    accent="#2196f3"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <MiniStat
                    icon={<Paid sx={{ fontSize: 18 }} />}
                    label={t("users.stats.ordersTotal")}
                    value={`${detail.stats.ordersTotalAmount.toLocaleString(locale)} ${t("market.currency")}`}
                    accent="#ff9800"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <MiniStat
                    icon={<LocationOn sx={{ fontSize: 18 }} />}
                    label={t("users.stats.addresses")}
                    value={String(detail.stats.addressesCount)}
                    accent="#9c27b0"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <MiniStat
                    icon={<Notifications sx={{ fontSize: 18 }} />}
                    label={t("users.stats.notifications")}
                    value={String(detail.stats.notificationsCount)}
                    accent="#00bcd4"
                  />
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <MiniStat
                    icon={<SmartToy sx={{ fontSize: 18 }} />}
                    label={t("users.stats.aiChats")}
                    value={String(detail.stats.aiConversationsCount)}
                    accent="#e91e63"
                  />
                </Grid>
              </Grid>
            </SectionBlock>

            {detail.pendingApplication ? (
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2.5,
                  borderColor: "warning.main",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark" ? "rgba(255, 152, 0, 0.08)" : "rgba(255, 152, 0, 0.06)",
                }}
              >
                <SectionBlock title={t("users.pendingApplication")}>
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
                </SectionBlock>
              </Paper>
            ) : null}

            {detail.company ? (
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: "divider" }}>
                <SectionBlock title={t("users.companyProfile")}>
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
                </SectionBlock>
              </Paper>
            ) : null}

            <SectionBlock title={t("users.recentOrders")}>
              {detail.recentOrders.length ? (
                <Stack spacing={1}>
                  {detail.recentOrders.map((order) => (
                    <Paper
                      key={order.id}
                      variant="outlined"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        borderColor: "divider",
                        transition: "background-color 0.15s",
                        "&:hover": { bgcolor: "action.hover" },
                      }}
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
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2.5,
                    borderRadius: 2,
                    borderStyle: "dashed",
                    borderColor: "divider",
                    textAlign: "center",
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("users.noOrders")}
                  </Typography>
                </Paper>
              )}
            </SectionBlock>
          </Stack>
        ) : null}
      </AppDrawer>
    </Stack>
  );
}
