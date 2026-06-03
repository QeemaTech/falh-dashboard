import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { ReusableTable } from "../../components/reusable-table";
import { fetchAdminCropPrices, type AdminCropPrice } from "../../services/admin-api";

type CropPriceRow = {
  crop: string;
  price: string;
  trend: string;
  source: string;
  recordedAt: string;
};

export function CropPricesPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-crop-prices"],
    queryFn: () => fetchAdminCropPrices({ page: 1, limit: 100 }),
  });

  const rows = useMemo<CropPriceRow[]>(() => {
    const items = (data?.items || []) as AdminCropPrice[];
    return items.map((item) => ({
      crop: item.cropName || item.cropNameEn || "-",
      price: `${item.currency} ${Number(item.pricePerKg || 0).toLocaleString()} / ${item.unit || "kg"}`,
      trend: item.trend || "stable",
      source: item.source || "-",
      recordedAt: new Date(item.recordedAt).toLocaleString(),
    }));
  }, [data?.items]);

  if (isLoading) return <Card>Loading crop prices...</Card>;
  if (isError) return <Card>Failed to load crop prices: {(error as Error).message}</Card>;
  if (!rows.length) return <Card>No crop prices available.</Card>;

  return (
    <ReusableTable<CropPriceRow>
      title="Crop Prices"
      columns={[
        { key: "crop", label: "Crop" },
        { key: "price", label: "Price" },
        { key: "trend", label: "Trend" },
        { key: "source", label: "Source" },
        { key: "recordedAt", label: "Recorded At" },
      ]}
      data={rows}
    />
  );
}
