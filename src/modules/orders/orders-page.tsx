import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MenuItem, Stack, TextField } from "@mui/material";
import { DataTable, EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { fetchAdminOrders, type AdminOrder } from "../../services/admin-api";

type OrderRow = {
  id: string;
  customer: string;
  status: string;
  total: string;
  createdAt: string;
};

export function OrdersPage() {
  const [status, setStatus] = useState("");

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
      status: order.status,
      total: `EGP ${Number(order.total || 0).toLocaleString()}`,
      createdAt: new Date(order.createdAt).toLocaleString(),
    }));
  }, [data?.items]);

  if (isError) {
    return <EmptyState title="Failed to load orders" description={(error as Error).message} />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader title="Orders" subtitle="Track and manage customer orders" />
      <FilterBar>
        <TextField
          select
          label="Order status"
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 220 }}
        >
          <MenuItem value="">All statuses</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="CONFIRMED">Confirmed</MenuItem>
          <MenuItem value="PREPARING">Preparing</MenuItem>
          <MenuItem value="DELIVERED">Delivered</MenuItem>
          <MenuItem value="CANCELLED">Cancelled</MenuItem>
        </TextField>
      </FilterBar>
      <DataTable<OrderRow>
        title="Orders"
        loading={isLoading}
        emptyMessage="No orders found for current filters."
        columns={[
          { key: "id", label: "Order ID" },
          { key: "customer", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "total", label: "Total" },
          { key: "createdAt", label: "Created At" },
        ]}
        data={rows}
        getRowKey={(row) => row.id}
      />
    </Stack>
  );
}
