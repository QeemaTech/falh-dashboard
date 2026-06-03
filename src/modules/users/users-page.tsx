import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchUsers } from "../../services/admin-api";
import { ReusableTable } from "../../components/reusable-table";
import { GlobalFilters } from "../../components/global-filters";
import { Card } from "../../components/ui/card";
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

  if (isLoading) return <Card>Loading users...</Card>;
  if (isError) return <Card>Failed to load users: {(error as Error).message}</Card>;
  if (!filtered.length) return <Card>No users found for the selected filter.</Card>;

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <GlobalFilters status={status} onStatusChange={setStatus} />
      <ReusableTable<User>
        title="المستخدمون"
        columns={[
          { key: "name", label: "الاسم" },
          { key: "email", label: "البريد" },
          { key: "phone", label: "الهاتف" },
          { key: "role", label: "الدور" },
          { key: "status", label: "الحالة" },
        ]}
        data={filtered}
      />
    </div>
  );
}
