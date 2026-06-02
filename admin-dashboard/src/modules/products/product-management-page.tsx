import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Eye, Filter, Search, Trash2 } from "lucide-react";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { AppBadge, AppDrawer, AppSelect, AppTable, AppTableCell, AppTableHead, AppTableHeaderCell, AppTableRow } from "../../components/design-system";
import {
  deleteProductApi,
  fetchAdminProducts,
  reviewProductApi,
  type AdminProduct,
} from "../../services/admin-api";

type Props = {
  pendingOnly?: boolean;
};

function badgeClass(status: string) {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED") return "danger";
  return "neutral";
}

export function ProductManagementPage({ pendingOnly = false }: Props) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(pendingOnly ? "PENDING" : "");
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerProduct, setDrawerProduct] = useState<AdminProduct | null>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-products", search, status],
    queryFn: () =>
      fetchAdminProducts({
        page: 1,
        limit: 50,
        search: search || undefined,
        status: status || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  const products = data?.items || [];
  const selectedProducts = useMemo(
    () => products.filter((product) => selected.includes(product.id)),
    [products, selected]
  );

  const approveMutation = useMutation({
    mutationFn: (id: string) => reviewProductApi(id, { action: "APPROVE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });
  const rejectMutation = useMutation({
    mutationFn: (id: string) => reviewProductApi(id, { action: "REJECT", adminNote: "Rejected by admin" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProductApi(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-products"] }),
  });

  const exportExcel = () => {
    const rows = (selectedProducts.length ? selectedProducts : products).map((product) => ({
      Title: product.title,
      Category: product.category?.nameAr || product.category?.nameEn || "-",
      Owner: product.company?.name || product.user?.name || "-",
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
      product.company?.name || product.user?.name || "-",
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
    for (const id of ids) {
      if (action === "approve") await approveMutation.mutateAsync(id);
      if (action === "reject") await rejectMutation.mutateAsync(id);
      if (action === "delete") await deleteMutation.mutateAsync(id);
    }
    setSelected([]);
  };

  if (isLoading) return <Card>Loading products...</Card>;
  if (isError) return <Card>Failed to load products: {(error as Error).message}</Card>;
  if (!products.length) return <Card>No products found for current filters.</Card>;

  return (
    <div className="space-y-4">
      <Card className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-72">
            <Search className="pointer-events-none absolute inset-s-3 top-3 size-4 text-neutral-400" />
            <Input
              placeholder="Search products..."
              className="ps-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-neutral-500" />
            <AppSelect value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACTIVE">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="SOLD">Sold</option>
              <option value="EXPIRED">Expired</option>
            </AppSelect>
          </div>
          <div className="ms-auto flex items-center gap-2">
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
          <Button variant="outline" onClick={() => runBulk("approve")} disabled={!selected.length}>
            Bulk Approve
          </Button>
          <Button variant="outline" onClick={() => runBulk("reject")} disabled={!selected.length}>
            Bulk Reject
          </Button>
          <Button variant="outline" onClick={() => runBulk("delete")} disabled={!selected.length}>
            Bulk Delete
          </Button>
          <span className="text-xs text-neutral-500">{selected.length} selected</span>
        </div>
      </Card>

      <AppTable containerClassName="min-w-[1100px]">
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
                  <input
                    type="checkbox"
                    checked={selected.includes(product.id)}
                    onChange={() => toggleSelect(product.id)}
                  />
                </AppTableCell>
                <AppTableCell>
                  {product.images?.[0]?.path ? (
                    <img
                      src={product.images[0].path}
                      alt={product.title}
                      className="h-10 w-10 rounded-md object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-neutral-200 dark:bg-neutral-700" />
                  )}
                </AppTableCell>
                <AppTableCell className="font-medium">{product.title}</AppTableCell>
                <AppTableCell>{product.category?.nameAr || product.category?.nameEn || "-"}</AppTableCell>
                <AppTableCell>{product.company?.name || product.user?.name || "-"}</AppTableCell>
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
                    <Button variant="ghost" onClick={() => setDrawerProduct(product)}>
                      <Eye className="size-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => approveMutation.mutate(product.id)}>
                      Approve
                    </Button>
                    <Button variant="ghost" onClick={() => rejectMutation.mutate(product.id)}>
                      Reject
                    </Button>
                    <Button variant="ghost" onClick={() => deleteMutation.mutate(product.id)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </AppTableCell>
              </AppTableRow>
            ))}
          </tbody>
      </AppTable>

      <AppDrawer
        open={Boolean(drawerProduct)}
        onClose={() => setDrawerProduct(null)}
        title="Product Details"
        footer={
          drawerProduct ? (
            <>
              <Button onClick={() => { approveMutation.mutate(drawerProduct.id); setDrawerProduct(null); }}>
                Approve
              </Button>
              <Button variant="outline" onClick={() => { rejectMutation.mutate(drawerProduct.id); setDrawerProduct(null); }}>
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
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Title:</span> {drawerProduct.title}</p>
              <p><span className="font-medium">Category:</span> {drawerProduct.category?.nameAr || drawerProduct.category?.nameEn || "-"}</p>
              <p><span className="font-medium">Owner:</span> {drawerProduct.company?.name || drawerProduct.user?.name || "-"}</p>
              <p><span className="font-medium">Status:</span> {drawerProduct.status}</p>
              <p><span className="font-medium">Price:</span> {drawerProduct.price ? `EGP ${drawerProduct.price}` : "-"}</p>
              <p><span className="font-medium">Location:</span> {drawerProduct.city || "-"}</p>
              <p><span className="font-medium">Created:</span> {new Date(drawerProduct.createdAt).toLocaleString()}</p>
              <p><span className="font-medium">Description:</span> {drawerProduct.description || "-"}</p>
            </div>
        ) : null}
      </AppDrawer>
    </div>
  );
}
