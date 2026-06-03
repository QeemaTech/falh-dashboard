import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { ReusableTable } from "../../components/reusable-table";
import { fetchAdminCategories, type AdminCategory } from "../../services/admin-api";

type CategoryRow = {
  id: string;
  nameAr: string;
  nameEn: string;
  sortOrder: string;
  isActive: string;
};

export function CategoriesPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => fetchAdminCategories({ page: 1, limit: 100, sortBy: "sortOrder", sortOrder: "asc" }),
  });

  const rows = useMemo<CategoryRow[]>(() => {
    const items = (data || []) as AdminCategory[];
    return items.map((category) => ({
      id: category.id,
      nameAr: category.nameAr || "-",
      nameEn: category.nameEn || "-",
      sortOrder: String(category.sortOrder ?? "-"),
      isActive: category.isActive ? "Active" : "Inactive",
    }));
  }, [data]);

  if (isLoading) return <Card>Loading categories...</Card>;
  if (isError) return <Card>Failed to load categories: {(error as Error).message}</Card>;
  if (!rows.length) return <Card>No categories found.</Card>;

  return (
    <ReusableTable<CategoryRow>
      title="Categories"
      columns={[
        { key: "id", label: "ID" },
        { key: "nameAr", label: "Arabic Name" },
        { key: "nameEn", label: "English Name" },
        { key: "sortOrder", label: "Sort" },
        { key: "isActive", label: "Status" },
      ]}
      data={rows}
    />
  );
}
