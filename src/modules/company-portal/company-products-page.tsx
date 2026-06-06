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
      setDeleteId(null);
    },
  });

  const products = (data?.items || []) as ProductRow[];
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["company-products"] });
    queryClient.invalidateQueries({ queryKey: ["company-quota"] });
  };

  if (isError) {
    return <EmptyState title="Failed to load products" description={(error as Error).message} />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title="My Products"
        subtitle={
          quota
            ? `Quota: ${quota.used ?? 0} / ${quota.maxProducts ?? 0} used (${quota.remaining} remaining)`
            : "Manage your product catalog"
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
            Add Product
          </Button>
        }
      />

      {quota && !quota.canAdd ? (
        <Alert severity="warning">
          Product limit reached. Remove or wait for rejected items to free quota.
        </Alert>
      ) : null}

      <DataTable<ProductRow>
        loading={isLoading}
        emptyMessage="No products yet. Create your first product."
        getRowKey={(row) => row.id}
        columns={[
          {
            key: "images",
            label: "Image",
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
          { key: "title", label: "Title" },
          {
            key: "status",
            label: "Status",
            render: (row) => <Chip label={row.status} color={statusChipColor(row.status)} size="small" />,
          },
          {
            key: "price",
            label: "Price",
            render: (row) => (row.price ? `EGP ${row.price}` : "-"),
          },
          {
            key: "id",
            label: "Actions",
            render: (row) => (
              <Stack direction="row" spacing={0.5}>
                <IconButton size="small" onClick={() => setViewProduct(row)} title="View">
                  <Visibility fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    setEditProduct(row);
                    setFormOpen(true);
                  }}
                  title="Edit"
                >
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => setDeleteId(row.id)} title="Delete">
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

      <AppDrawer open={Boolean(viewProduct)} onClose={() => setViewProduct(null)} title="Product Details">
        {viewProduct ? (
          <Stack spacing={1.5}>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>Title:</Box> {viewProduct.title}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>Status:</Box> {viewProduct.status}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>Description:</Box> {viewProduct.description || "-"}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Submitted products stay private until admin approves (ACTIVE).
            </Typography>
          </Stack>
        ) : null}
      </AppDrawer>

      <AppDrawer open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Delete Product">
        <Typography variant="body2" sx={{ mb: 2 }}>
          Delete this product permanently?
        </Typography>
        <Button variant="contained" color="error" onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
          Confirm Delete
        </Button>
      </AppDrawer>
    </Stack>
  );
}
