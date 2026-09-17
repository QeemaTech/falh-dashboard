import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DataTable, EmptyState, FilterBar, PageHeader, TableRowActions } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { fetchUsers } from "../../services/admin-api";
import type { User } from "../../types/dashboard";

type UserRow = User & Record<string, unknown>;

function statusChipColor(status: User["status"]): "success" | "warning" | "error" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING_VERIFICATION") return "warning";
  if (status === "SUSPENDED") return "error";
  return "default";
}

export function UsersPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const [status, setStatus] = useState("");
  const [role, setRole] = useState("");
  const [search, setSearch] = useState("");

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

  const statusLabel = (value: User["status"]) => t(`users.status.${value}`);
  const roleLabel = (value: User["role"]) => t(`users.role.${value}`);

  const rows = useMemo<UserRow[]>(() => (data?.users ?? []) as UserRow[], [data?.users]);

  if (isError) {
    return <EmptyState title={t("users.loadFailed")} description={(error as Error).message} />;
  }

  return (
    <Stack spacing={2.5}>
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
            render: (row) => <Chip label={roleLabel(row.role)} size="small" variant="outlined" />,
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
              <TableRowActions
                onView={() => navigate(`/users/${row.id}`)}
                onEdit={() => navigate(`/users/${row.id}`)}
              />
            ),
          },
        ]}
        data={rows}
      />
    </Stack>
  );
}
