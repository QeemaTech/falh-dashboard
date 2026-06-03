import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, Filter, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { AppBadge, AppDrawer, AppSelect, AppTable, AppTableCell, AppTableHead, AppTableHeaderCell, AppTableRow } from "../../components/design-system";
import {
  bulkReviewProductsApi,
  deleteProductApi,
  fetchAdminProducts,
  reviewProductApi,
  type AdminProduct,
} from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import { ProductFormDrawer } from "./product-form-drawer";

type Props = {
  pendingOnly?: boolean;
};

function badgeClass(status: string) {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED") return "danger";
  if (status === "DRAFT") return "neutral";
  return "neutral";
}

function canModerate(status: string) {
  return status === "PENDING";
}

export function ProductManagementPage({ pendingOnly = false }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(pendingOnly ? "PENDING" : "");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerProduct, setDrawerProduct] = useState<AdminProduct | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<AdminProduct | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const limit = 20;

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["admin-products", search, status, page],
    queryFn: () =>
      fetchAdminProducts({
        page,
        limit,
        search: search || undefined,
        status: status || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  const products = data?.items || [];
  const totalPages = data?.meta?.totalPages || 1;
  const selectedProducts = useMemo(
    () => products.filter((product) => selected.includes(product.id)),
    [products, selected]
  );

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-products"] });

  const approveMutation = useMutation({
    mutationFn: (id: string) => reviewProductApi(id, { action: "APPROVE" }),
    onSuccess: invalidate,
  });
  const rejectMutation = useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      reviewProductApi(id, { action: "REJECT", adminNote: adminNote || "Rejected by admin" }),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProductApi(id),
    onSuccess: () => {
      invalidate();
      setConfirmDeleteId(null);
    },
  });
  const bulkMutation = useMutation({
    mutationFn: (payload: { productIds: string[]; action: "APPROVE" | "REJECT"; adminNote?: string }) =>
      bulkReviewProductsApi(payload),
    onSuccess: () => {
      setSelected([]);
      invalidate();
    },
  });

  const exportExcel = () => {
    const rows = (selectedProducts.length ? selectedProducts : products).map((product) => ({
      Title: product.title,
      Category: product.category?.nameAr || product.category?.nameEn || "-",
      Owner: product.company?.name || product.user?.name || "Global",
      Status: product.status,
      Price: product.price ?? "-",
      Location: product.city || "-",
      "Created Date": new Date(product.createdAt).toLocaleString(),
    }));
    const ws = XLSXUtils.json_to_sheet(rows);
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, ws, "Products");
    XLSXWriteFile(wb, "products.xlsx");
  };

  const exportPdf = () => {
    const pdf = new jsPDF();
    const rows = (selectedProducts.length ? selectedProducts : products).map((product) => [
      product.title,
      product.category?.nameAr || product.category?.nameEn || "-",
      product.company?.name || product.user?.name || "Global",
      product.status,
      product.price ?? "-",
      product.city || "-",
      new Date(product.createdAt).toLocaleDateString(),
    ]);
    autoTable(pdf, {
      head: [["Title", "Category", "Owner", "Status", "Price", "Location", "Created Date"]],
      body: rows,
      styles: { fontSize: 8 },
    });
    pdf.save("products.pdf");
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const runBulk = async (action: "approve" | "reject" | "delete") => {
    const ids = selected;
    if (ids.length === 0) return;
    if (action === "delete") {
      for (const id of ids) await deleteMutation.mutateAsync(id);
      setSelected([]);
      return;
    }
    await bulkMutation.mutateAsync({
      productIds: ids,
      action: action === "approve" ? "APPROVE" : "REJECT",
      adminNote: rejectNote || "Rejected by admin",
    });
  };

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-xs min-w-0 sm:max-w-sm">
            <Search className="pointer-events-none absolute inset-s-3 top-3 size-4 text-neutral-400" />
            <Input
              placeholder="Search products..."
              className="ps-9"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-neutral-500" />
            <AppSelect
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SOLD">Sold</option>
              <option value="EXPIRED">Expired</option>
            </AppSelect>
          </div>
          <div className="ms-auto flex items-center gap-2">
            <Button onClick={() => { setEditProduct(null); setFormOpen(true); }}>
              <Plus className="me-2 size-4" />
              Add Product
            </Button>
            <Button variant="outline" onClick={exportExcel}>
              <Download className="me-2 size-4" />
              Export Excel
            </Button>
            <Button variant="outline" onClick={exportPdf}>
              <Download className="me-2 size-4" />
              Export PDF
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t pt-3">
          <Button variant="outline" onClick={() => runBulk("approve")} disabled={!selected.length || bulkMutation.isPending}>
            Bulk Approve
          </Button>
          <Button variant="outline" onClick={() => runBulk("reject")} disabled={!selected.length || bulkMutation.isPending}>
            Bulk Reject
          </Button>
          <Button variant="outline" onClick={() => runBulk("delete")} disabled={!selected.length || deleteMutation.isPending}>
            Bulk Delete
          </Button>
          <Input
            className="max-w-xs"
            placeholder="Reject note (bulk)"
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
          />
          <span className="text-xs text-neutral-500">{selected.length} selected</span>
        </div>
      </Card>

      {isLoading ? <Card>Loading products...</Card> : null}
      {isError ? <Card>Failed to load products: {(error as Error).message}</Card> : null}
      {!isLoading && !isError && !products.length ? (
        <Card className="p-8 text-center text-neutral-500">No products found for current filters.</Card>
      ) : null}

      {!isLoading && !isError && products.length > 0 ? (
        <>
          <AppTable>
            <AppTableHead>
              <tr>
                <AppTableHeaderCell>
                  <input
                    type="checkbox"
                    checked={products.length > 0 && selected.length === products.length}
                    onChange={(e) => setSelected(e.target.checked ? products.map((p) => p.id) : [])}
                  />
                </AppTableHeaderCell>
                <AppTableHeaderCell>Images</AppTableHeaderCell>
                <AppTableHeaderCell>Title</AppTableHeaderCell>
                <AppTableHeaderCell>Category</AppTableHeaderCell>
                <AppTableHeaderCell>Owner</AppTableHeaderCell>
                <AppTableHeaderCell>Status</AppTableHeaderCell>
                <AppTableHeaderCell>Price</AppTableHeaderCell>
                <AppTableHeaderCell>Location</AppTableHeaderCell>
                <AppTableHeaderCell>Created Date</AppTableHeaderCell>
                <AppTableHeaderCell>Actions</AppTableHeaderCell>
              </tr>
            </AppTableHead>
            <tbody>
              {products.map((product) => (
                <AppTableRow key={product.id}>
                  <AppTableCell>
                    <input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggleSelect(product.id)} />
                  </AppTableCell>
                  <AppTableCell>
                    {product.images?.[0]?.path ? (
                      <img
                        src={resolveAssetUrl(product.images[0].path)}
                        alt={product.title}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-neutral-200 dark:bg-neutral-700" />
                    )}
                  </AppTableCell>
                  <AppTableCell className="font-medium">{product.title}</AppTableCell>
                  <AppTableCell>{product.category?.nameAr || product.category?.nameEn || "-"}</AppTableCell>
                  <AppTableCell>{product.company?.name || product.user?.name || "Global"}</AppTableCell>
                  <AppTableCell>
                    <AppBadge variant={badgeClass(product.status) as "success" | "warning" | "danger" | "neutral"}>
                      {product.status}
                    </AppBadge>
                  </AppTableCell>
                  <AppTableCell>{product.price ? `EGP ${product.price}` : "-"}</AppTableCell>
                  <AppTableCell>{product.city || "-"}</AppTableCell>
                  <AppTableCell>{new Date(product.createdAt).toLocaleDateString()}</AppTableCell>
                  <AppTableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" onClick={() => setDrawerProduct(product)} title="View">
                        <Eye className="size-4" />
                      </Button>
                      <Button variant="ghost" onClick={() => { setEditProduct(product); setFormOpen(true); }} title="Edit">
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={!canModerate(product.status)}
                        onClick={() => approveMutation.mutate(product.id)}
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        disabled={!canModerate(product.status)}
                        onClick={() => rejectMutation.mutate({ id: product.id, adminNote: rejectNote })}
                      >
                        Reject
                      </Button>
                      <Button variant="ghost" onClick={() => setConfirmDeleteId(product.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </AppTableCell>
                </AppTableRow>
              ))}
            </tbody>
          </AppTable>

          <div className="flex items-center justify-between">
            <p className="text-sm text-neutral-500">
              Page {page} of {totalPages} {isFetching ? "(refreshing...)" : ""}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>
                Previous
              </Button>
              <Button variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        </>
      ) : null}

      <AppDrawer
        open={Boolean(drawerProduct)}
        onClose={() => setDrawerProduct(null)}
        title="Product Details"
        footer={
          drawerProduct ? (
            <>
              <Button
                disabled={!canModerate(drawerProduct.status)}
                onClick={() => { approveMutation.mutate(drawerProduct.id); setDrawerProduct(null); }}
              >
                Approve
              </Button>
              <Button
                variant="outline"
                disabled={!canModerate(drawerProduct.status)}
                onClick={() => { rejectMutation.mutate({ id: drawerProduct.id, adminNote: rejectNote }); setDrawerProduct(null); }}
              >
                Reject
              </Button>
              <Button variant="ghost" onClick={() => setDrawerProduct(null)}>
                Close
              </Button>
            </>
          ) : null
        }
      >
        {drawerProduct ? (
          <div className="space-y-3 text-sm">
            {drawerProduct.images?.length ? (
              <div className="flex flex-wrap gap-2">
                {drawerProduct.images.map((img) => (
                  <img key={img.id} src={resolveAssetUrl(img.path)} alt="" className="h-20 w-20 rounded-md object-cover" />
                ))}
              </div>
            ) : null}
            <p><span className="font-medium">Title:</span> {drawerProduct.title}</p>
            <p><span className="font-medium">Category:</span> {drawerProduct.category?.nameAr || drawerProduct.category?.nameEn || "-"}</p>
            <p><span className="font-medium">Owner:</span> {drawerProduct.company?.name || drawerProduct.user?.name || "Global"}</p>
            <p><span className="font-medium">Status:</span> {drawerProduct.status}</p>
            <p><span className="font-medium">Price:</span> {drawerProduct.price ? `EGP ${drawerProduct.price}` : "-"}</p>
            <p><span className="font-medium">Location:</span> {drawerProduct.city || "-"}</p>
            <p><span className="font-medium">Created:</span> {new Date(drawerProduct.createdAt).toLocaleString()}</p>
            <p><span className="font-medium">Description:</span> {drawerProduct.description || "-"}</p>
          </div>
        ) : null}
      </AppDrawer>

      <AppDrawer
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        title="Confirm Delete"
        footer={
          <>
            <Button onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}>
              Delete
            </Button>
            <Button variant="ghost" onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </Button>
          </>
        }
      >
        <p className="text-sm">This permanently removes the product from all lists.</p>
      </AppDrawer>

      <ProductFormDrawer
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditProduct(null); }}
        onSuccess={invalidate}
        scope="admin"
        product={editProduct}
      />
    </div>
  );
}
