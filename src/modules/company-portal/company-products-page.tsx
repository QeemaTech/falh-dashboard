import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { AppBadge, AppDrawer, AppTable, AppTableCell, AppTableHead, AppTableHeaderCell, AppTableRow } from "../../components/design-system";
import { ProductFormDrawer } from "../products/product-form-drawer";
import {
  deleteCompanyProductApi,
  fetchCompanyQuota,
  fetchMyProducts,
} from "../../services/products-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import type { AdminProduct } from "../../services/admin-api";

function badgeClass(status: string) {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED") return "danger";
  if (status === "DRAFT") return "neutral";
  return "neutral";
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

  const products = data?.items || [];
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["company-products"] });
    queryClient.invalidateQueries({ queryKey: ["company-quota"] });
  };

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div>
          <h2 className="text-lg font-semibold">My Products</h2>
          <p className="text-sm text-neutral-500">
            Quota: {quota?.used ?? 0} / {quota?.maxProducts ?? 0} used
            {quota ? ` (${quota.remaining} remaining)` : ""}
          </p>
          {quota && !quota.canAdd ? (
            <p className="text-sm text-amber-600">Product limit reached. Remove or wait for rejected items to free quota.</p>
          ) : null}
        </div>
        <Button disabled={quota ? !quota.canAdd : false} onClick={() => { setEditProduct(null); setFormOpen(true); }}>
          <Plus className="me-2 size-4" />
          Add Product
        </Button>
      </Card>

      {isLoading ? <Card>Loading...</Card> : null}
      {isError ? <Card>{(error as Error).message}</Card> : null}
      {!isLoading && !products.length ? <Card>No products yet. Create your first product.</Card> : null}

      {products.length > 0 ? (
        <AppTable>
          <AppTableHead>
            <tr>
              <AppTableHeaderCell>Image</AppTableHeaderCell>
              <AppTableHeaderCell>Title</AppTableHeaderCell>
              <AppTableHeaderCell>Status</AppTableHeaderCell>
              <AppTableHeaderCell>Price</AppTableHeaderCell>
              <AppTableHeaderCell>Actions</AppTableHeaderCell>
            </tr>
          </AppTableHead>
          <tbody>
            {products.map((product) => (
              <AppTableRow key={product.id}>
                <AppTableCell>
                  {product.images?.[0]?.path ? (
                    <img src={resolveAssetUrl(product.images[0].path)} alt="" className="h-10 w-10 rounded-md object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-neutral-200" />
                  )}
                </AppTableCell>
                <AppTableCell>{product.title}</AppTableCell>
                <AppTableCell>
                  <AppBadge variant={badgeClass(product.status) as "success" | "warning" | "danger" | "neutral"}>
                    {product.status}
                  </AppBadge>
                </AppTableCell>
                <AppTableCell>{product.price ? `EGP ${product.price}` : "-"}</AppTableCell>
                <AppTableCell className="flex gap-1">
                  <Button variant="ghost" onClick={() => setViewProduct(product)}><Eye className="size-4" /></Button>
                  <Button variant="ghost" onClick={() => { setEditProduct(product); setFormOpen(true); }}><Pencil className="size-4" /></Button>
                  <Button variant="ghost" onClick={() => setDeleteId(product.id)}><Trash2 className="size-4" /></Button>
                </AppTableCell>
              </AppTableRow>
            ))}
          </tbody>
        </AppTable>
      ) : null}

      <ProductFormDrawer
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditProduct(null); }}
        onSuccess={invalidate}
        scope="company"
        product={editProduct}
        canAdd={quota?.canAdd ?? true}
      />

      <AppDrawer open={Boolean(viewProduct)} onClose={() => setViewProduct(null)} title="Product Details">
        {viewProduct ? (
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Title:</span> {viewProduct.title}</p>
            <p><span className="font-medium">Status:</span> {viewProduct.status}</p>
            <p><span className="font-medium">Description:</span> {viewProduct.description || "-"}</p>
            <p className="text-xs text-neutral-500">Submitted products stay private until admin approves (ACTIVE).</p>
          </div>
        ) : null}
      </AppDrawer>

      <AppDrawer open={Boolean(deleteId)} onClose={() => setDeleteId(null)} title="Delete Product">
        <p className="mb-4 text-sm">Delete this product permanently?</p>
        <Button onClick={() => deleteId && deleteMutation.mutate(deleteId)}>
          Confirm Delete
        </Button>
      </AppDrawer>
    </div>
  );
}
