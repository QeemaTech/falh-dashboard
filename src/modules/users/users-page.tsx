import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem, TextField } from "@mui/material";
import { Stack } from "@mui/material";
import { DataTable, EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { fetchUsers } from "../../services/admin-api";
import type { User } from "../../types/dashboard";

export function UsersPage() {
  const [status, setStatus] = useState("");
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["users", status],
    queryFn: () => fetchUsers({ page: 1, limit: 20, search: "", sortBy: "createdAt", sortOrder: "desc" }),
  });

  const filtered = useMemo(() => {
    const rows = data?.users ?? [];
    return status ? rows.filter((u) => u.status === status) : rows;
  }, [data?.users, status]);

  if (isError) {
    return <EmptyState title="Failed to load users" description={(error as Error).message} />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader title="المستخدمون" subtitle="Manage platform users and their access status" />
      <FilterBar>
        <TextField
          select
          label="Status"
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value="ACTIVE">Active</MenuItem>
          <MenuItem value="SUSPENDED">Suspended</MenuItem>
          <MenuItem value="PENDING_VERIFICATION">Pending verification</MenuItem>
        </TextField>
      </FilterBar>
      <DataTable<User>
        title="Users list"
        loading={isLoading}
        emptyMessage="No users found for the selected filter."
        columns={[
          { key: "name", label: "الاسم" },
          { key: "email", label: "البريد" },
          { key: "phone", label: "الهاتف" },
          { key: "role", label: "الدور" },
          { key: "status", label: "الحالة" },
        ]}
        data={filtered}
        getRowKey={(row) => row.id}
      />
    </Stack>
  );
}
