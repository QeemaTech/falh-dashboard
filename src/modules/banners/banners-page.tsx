import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { ReusableTable } from "../../components/reusable-table";
import { fetchAdminBanners, type AdminBanner } from "../../services/admin-api";

type BannerRow = {
  title: string;
  linkType: string;
  sortOrder: string;
  status: string;
  createdAt: string;
};

export function BannersPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: fetchAdminBanners,
  });

  const rows = useMemo<BannerRow[]>(() => {
    const items = (data || []) as AdminBanner[];
    return items.map((banner) => ({
      title: banner.title,
      linkType: banner.linkType || "-",
      sortOrder: String(banner.sortOrder ?? 0),
      status: banner.isActive ? "Active" : "Inactive",
      createdAt: new Date(banner.createdAt).toLocaleString(),
    }));
  }, [data]);

  if (isLoading) return <Card>Loading banners...</Card>;
  if (isError) return <Card>Failed to load banners: {(error as Error).message}</Card>;
  if (!rows.length) return <Card>No banners found.</Card>;

  return (
    <ReusableTable<BannerRow>
      title="Banners"
      columns={[
        { key: "title", label: "Title" },
        { key: "linkType", label: "Link Type" },
        { key: "sortOrder", label: "Sort Order" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Created At" },
      ]}
      data={rows}
    />
  );
}
