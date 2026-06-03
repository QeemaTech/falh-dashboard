import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { ReusableTable } from "../../components/reusable-table";
import { AppSelect } from "../../components/design-system";
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

  if (isLoading) return <Card>Loading orders...</Card>;
  if (isError) return <Card>Failed to load orders: {(error as Error).message}</Card>;
  if (!rows.length) return <Card>No orders found for current filters.</Card>;

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <Card className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-(--app-text-secondary)">Filter by order status</p>
        <AppSelect value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PREPARING">Preparing</option>
          <option value="DELIVERED">Delivered</option>
          <option value="CANCELLED">Cancelled</option>
        </AppSelect>
      </Card>
      <ReusableTable<OrderRow>
        title="Orders"
        columns={[
          { key: "id", label: "Order ID" },
          { key: "customer", label: "Customer" },
          { key: "status", label: "Status" },
          { key: "total", label: "Total" },
          { key: "createdAt", label: "Created At" },
        ]}
        data={rows}
      />
    </div>
  );
}
