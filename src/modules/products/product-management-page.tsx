import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add, Delete, Download, Edit, Search, Tune, Visibility } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AppBadge, AppDrawer, AppTable, AppTableCell, AppTableHead, AppTableHeaderCell, AppTableRow } from "../../components/design-system";
import { EmptyState, FilterBar, PageHeader } from "../../components/layout";
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
    <Stack spacing={3}>
      <PageHeader
        title={pendingOnly ? "Pending Products" : "Products"}
        subtitle="Manage catalog items, moderation, and exports"
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => { setEditProduct(null); setFormOpen(true); }}>
            Add Product
          </Button>
        }
      />

      <FilterBar>
        <TextField
          size="small"
          placeholder="Search products..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          sx={{ minWidth: { xs: "100%", sm: 260 } }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> } }}
        />
        <TextField
          select
          label="Status"
          size="small"
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          sx={{ minWidth: 180 }}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Tune fontSize="small" /></InputAdornment> } }}
        >
          <MenuItem value="">All Statuses</MenuItem>
          <MenuItem value="DRAFT">Draft</MenuItem>
          <MenuItem value="PENDING">Pending</MenuItem>
          <MenuItem value="ACTIVE">Approved</MenuItem>
          <MenuItem value="REJECTED">Rejected</MenuItem>
          <MenuItem value="SOLD">Sold</MenuItem>
          <MenuItem value="EXPIRED">Expired</MenuItem>
        </TextField>
        <Stack direction="row" spacing={1} sx={{ ml: { sm: "auto" }, flexWrap: "wrap" }}>
          <Button variant="outlined" startIcon={<Download />} onClick={exportExcel}>Export Excel</Button>
          <Button variant="outlined" startIcon={<Download />} onClick={exportPdf}>Export PDF</Button>
        </Stack>
      </FilterBar>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center" }}>
          <Button variant="outlined" size="small" onClick={() => runBulk("approve")} disabled={!selected.length || bulkMutation.isPending}>Bulk Approve</Button>
          <Button variant="outlined" size="small" onClick={() => runBulk("reject")} disabled={!selected.length || bulkMutation.isPending}>Bulk Reject</Button>
          <Button variant="outlined" size="small" color="error" onClick={() => runBulk("delete")} disabled={!selected.length || deleteMutation.isPending}>Bulk Delete</Button>
          <TextField size="small" placeholder="Reject note (bulk)" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} sx={{ minWidth: 200 }} />
          <Typography variant="caption" color="text.secondary">{selected.length} selected</Typography>
        </Stack>
      </Paper>

      {isLoading ? (
        <Stack sx={{ py: 4, alignItems: "center" }}><CircularProgress size={28} /></Stack>
      ) : null}
      {isError ? <EmptyState title="Failed to load products" description={(error as Error).message} /> : null}
      {!isLoading && !isError && !products.length ? (
        <EmptyState title="No products found" description="Try adjusting your search or filters." />
      ) : null}

      {!isLoading && !isError && products.length > 0 ? (
        <>
          <AppTable>
            <AppTableHead>
              <tr>
                <AppTableHeaderCell>
                  <Checkbox
                    size="small"
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
                    <Checkbox size="small" checked={selected.includes(product.id)} onChange={() => toggleSelect(product.id)} />
                  </AppTableCell>
                  <AppTableCell>
                    {product.images?.[0]?.path ? (
                      <Box component="img" src={resolveAssetUrl(product.images[0].path)} alt={product.title} sx={{ height: 40, width: 40, borderRadius: 1, objectFit: "cover" }} />
                    ) : (
                      <Box sx={{ height: 40, width: 40, borderRadius: 1, bgcolor: "action.hover" }} />
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
                    <Stack direction="row" spacing={0.5}>
                      <IconButton size="small" onClick={() => setDrawerProduct(product)} title="View"><Visibility fontSize="small" /></IconButton>
                      <IconButton size="small" onClick={() => { setEditProduct(product); setFormOpen(true); }} title="Edit"><Edit fontSize="small" /></IconButton>
                      <Button size="small" disabled={!canModerate(product.status)} onClick={() => approveMutation.mutate(product.id)}>Approve</Button>
                      <Button size="small" disabled={!canModerate(product.status)} onClick={() => rejectMutation.mutate({ id: product.id, adminNote: rejectNote })}>Reject</Button>
                      <IconButton size="small" color="error" onClick={() => setConfirmDeleteId(product.id)}><Delete fontSize="small" /></IconButton>
                    </Stack>
                  </AppTableCell>
                </AppTableRow>
              ))}
            </tbody>
          </AppTable>

          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Page {page} of {totalPages} {isFetching ? "(refreshing...)" : ""}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" size="small" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous</Button>
              <Button variant="outlined" size="small" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </Stack>
          </Stack>
        </>
      ) : null}

      <AppDrawer
        open={Boolean(drawerProduct)}
        onClose={() => setDrawerProduct(null)}
        title="Product Details"
        footer={
          drawerProduct ? (
            <Stack direction="row" spacing={1}>
              <Button variant="contained" disabled={!canModerate(drawerProduct.status)} onClick={() => { approveMutation.mutate(drawerProduct.id); setDrawerProduct(null); }}>Approve</Button>
              <Button variant="outlined" disabled={!canModerate(drawerProduct.status)} onClick={() => { rejectMutation.mutate({ id: drawerProduct.id, adminNote: rejectNote }); setDrawerProduct(null); }}>Reject</Button>
              <Button onClick={() => setDrawerProduct(null)}>Close</Button>
            </Stack>
          ) : null
        }
      >
        {drawerProduct ? (
          <Stack spacing={2}>
            {drawerProduct.images?.length ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {drawerProduct.images.map((img) => (
                  <Box key={img.id} component="img" src={resolveAssetUrl(img.path)} alt="" sx={{ height: 80, width: 80, borderRadius: 1, objectFit: "cover" }} />
                ))}
              </Stack>
            ) : null}
            <Typography variant="body2"><strong>Title:</strong> {drawerProduct.title}</Typography>
            <Typography variant="body2"><strong>Category:</strong> {drawerProduct.category?.nameAr || drawerProduct.category?.nameEn || "-"}</Typography>
            <Typography variant="body2"><strong>Owner:</strong> {drawerProduct.company?.name || drawerProduct.user?.name || "Global"}</Typography>
            <Typography variant="body2"><strong>Status:</strong> {drawerProduct.status}</Typography>
            <Typography variant="body2"><strong>Price:</strong> {drawerProduct.price ? `EGP ${drawerProduct.price}` : "-"}</Typography>
            <Typography variant="body2"><strong>Location:</strong> {drawerProduct.city || "-"}</Typography>
            <Typography variant="body2"><strong>Created:</strong> {new Date(drawerProduct.createdAt).toLocaleString()}</Typography>
            <Typography variant="body2"><strong>Description:</strong> {drawerProduct.description || "-"}</Typography>
          </Stack>
        ) : null}
      </AppDrawer>

      <AppDrawer
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        title="Confirm Delete"
        footer={
          <Stack direction="row" spacing={1}>
            <Button variant="contained" color="error" onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}>Delete</Button>
            <Button onClick={() => setConfirmDeleteId(null)}>Cancel</Button>
          </Stack>
        }
      >
        <Typography variant="body2">This permanently removes the product from all lists.</Typography>
      </AppDrawer>

      <ProductFormDrawer
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditProduct(null); }}
        onSuccess={invalidate}
        scope="admin"
        product={editProduct}
      />
    </Stack>
  );
}
