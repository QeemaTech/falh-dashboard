import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { ReusableTable } from "../../components/reusable-table";
import { fetchAdminServiceProviders, type AdminServiceProvider } from "../../services/admin-api";

type ConsultantRow = {
  name: string;
  type: string;
  city: string;
  status: string;
  rating: string;
};

export function ConsultantsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-consultants"],
    queryFn: () => fetchAdminServiceProviders({ page: 1, limit: 100, sortBy: "createdAt", sortOrder: "desc" }),
  });

  const rows = useMemo<ConsultantRow[]>(() => {
    const items = ((data?.items || []) as AdminServiceProvider[]).filter(
      (provider) => provider.type === "CONSULTANT" || provider.type === "ENGINEER" || provider.type === "DOCTOR"
    );
    return items.map((provider) => ({
      name: provider.user?.name || "-",
      type: provider.type,
      city: provider.city || "-",
      status: provider.status,
      rating: Number(provider.rating || 0).toFixed(1),
    }));
  }, [data?.items]);

  if (isLoading) return <Card>Loading consultants...</Card>;
  if (isError) return <Card>Failed to load consultants: {(error as Error).message}</Card>;
  if (!rows.length) return <Card>No consultants found.</Card>;

  return (
    <ReusableTable<ConsultantRow>
      title="Consultants"
      columns={[
        { key: "name", label: "Name" },
        { key: "type", label: "Type" },
        { key: "city", label: "City" },
        { key: "status", label: "Status" },
        { key: "rating", label: "Rating" },
      ]}
      data={rows}
    />
  );
}
