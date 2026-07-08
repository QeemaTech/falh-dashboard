import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add, Delete, Edit, Visibility } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { AppDrawer } from "../../components/design-system";
import { DataTable, EmptyState, PageHeader } from "../../components/layout";
import { ProductFormDrawer } from "../products/product-form-drawer";
import { useI18n } from "../../hooks/use-i18n";
import {
  deleteCompanyProductApi,
  fetchCompanyQuota,
  fetchMyProducts,
} from "../../services/products-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import type { AdminProduct } from "../../services/admin-api";

type ProductRow = AdminProduct & Record<string, unknown>;

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED") return "error";
  return "default";
}

export function CompanyProductsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [viewProduct, setViewProduct] = useState<AdminProduct | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: quota } = useQuery({ queryKey: ["company-quota"], queryFn: fetchCompanyQuota });
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["company-products"],
    queryFn: () => fetchMyProducts({ page: 1, limit: 100 }),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCompanyProductApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["company-products"] });
      queryClient.invalidateQueries({ queryKey: ["company-quota"] });
      queryClient.invalidateQueries({ queryKey: ["company-dashboard"] });
      setDeleteId(null);
    },
  });

  const products = (data?.items || []) as ProductRow[];
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["company-products"] });
    queryClient.invalidateQueries({ queryKey: ["company-quota"] });
    queryClient.invalidateQueries({ queryKey: ["company-dashboard"] });
  };

  if (isError) {
    return (
      <EmptyState title={t("company.products.loadFailed")} description={(error as Error).message} />
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title={t("company.products.title")}
        subtitle={
          quota
            ? `${t("company.dashboard.quotaUsed")}: ${quota.used ?? 0} / ${quota.maxProducts ?? 0} · ${quota.remaining} ${t("company.dashboard.quotaRemaining")}`
            : t("company.products.subtitle")
        }
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            disabled={quota ? !quota.canAdd : false}
            onClick={() => {
              setEditProduct(null);
              setFormOpen(true);
            }}
          >
            {t("company.products.add")}
          </Button>
        }
      />

      {quota && !quota.canAdd ? (
        <Alert severity="warning">{t("company.dashboard.quotaFull")}</Alert>
      ) : null}

      <DataTable<ProductRow>
        loading={isLoading}
        emptyMessage={t("company.products.empty")}
        getRowKey={(row) => row.id}
        columns={[
          {
            key: "images",
            label: t("company.products.col.image"),
            render: (row) =>
              row.images?.[0]?.path ? (
                <Avatar
                  variant="rounded"
                  src={resolveAssetUrl(row.images[0].path)}
                  alt=""
                  sx={{ width: 40, height: 40 }}
                />
              ) : (
                <Avatar variant="rounded" sx={{ width: 40, height: 40, bgcolor: "grey.300" }} />
              ),
          },
          { key: "title", label: t("company.products.col.title") },
          {
            key: "status",
            label: t("company.products.col.status"),
            render: (row) => (
              <Chip label={row.status} color={statusChipColor(row.status)} size="small" />
            ),
          },
          {
            key: "price",
            label: t("company.products.col.price"),
            render: (row) => (row.price ? `EGP ${row.price}` : "-"),
          },
          {
            key: "id",
            label: t("company.products.col.actions"),
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={() => setViewProduct(row)} title={t("company.products.view")}>
                  <Visibility fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditProduct(row);
                    setFormOpen(true);
                  }}
                  title={t("company.products.edit")}
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => setDeleteId(row.id)} title={t("company.products.delete")}>
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            ),
          },
        ]}
        data={products}
      />

      <ProductFormDrawer
        open={formOpen}
        onClose={() => {
          setFormOpen(false);
          setEditProduct(null);
        }}
        onSuccess={invalidate}
        scope="company"
        product={editProduct}
        canAdd={quota?.canAdd ?? true}
      />

      <AppDrawer
        open={Boolean(viewProduct)}
        onClose={() => setViewProduct(null)}
        title={t("company.products.details")}
      >
        {viewProduct ? (
          <Stack spacing={1.5}>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("company.products.col.title")}:
              </Box>{" "}
              {viewProduct.title}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("company.products.col.status")}:
              </Box>{" "}
              {viewProduct.status}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("company.profile.description")}:
              </Box>{" "}
              {viewProduct.description || "-"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("company.products.pendingHint")}
            </Typography>
          </Stack>
        ) : null}
      </AppDrawer>

      <AppDrawer open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title={t("company.products.delete")}>
        <Typography variant="body2" sx={{ mb: 2 }}>
          {t("company.products.deleteConfirm")}
        </Typography>
        <Button
          variant="contained"
          color="error"
          onClick={() => deleteId && deleteMutation.mutate(deleteId)}
        >
          {t("company.products.deleteConfirmBtn")}
        </Button>
      </AppDrawer>
    </Stack>
  );
}
