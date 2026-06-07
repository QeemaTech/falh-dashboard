import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add, Delete, Download, Edit, Search, Tune, Visibility } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Chip,
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
import {
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
  AppTableRow,
  AppDrawer,
} from "../../components/design-system";
import { EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
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

type ProductStatus = AdminProduct["status"];

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED") return "error";
  return "default";
}

function canModerate(status: string) {
  return status === "PENDING";
}

function categoryLabel(
  product: AdminProduct,
  language: "ar" | "en"
) {
  const cat = product.category;
  if (!cat) return "-";
  return language === "ar" ? cat.nameAr || cat.nameEn || "-" : cat.nameEn || cat.nameAr || "-";
}

export function ProductManagementPage({ pendingOnly = false }: Props) {
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
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

  const statusLabel = (value: ProductStatus) =>
    t(`products.status.${value}` as "products.status.PENDING");

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
      [t("products.col.title")]: product.title,
      [t("products.col.category")]: categoryLabel(product, language),
      [t("products.col.owner")]: product.company?.name || product.user?.name || t("products.globalOwner"),
      [t("products.col.status")]: statusLabel(product.status),
      [t("products.col.price")]: product.price ?? "-",
      [t("products.col.location")]: product.city || "-",
      [t("products.col.created")]: new Date(product.createdAt).toLocaleString(locale),
    }));
    const ws = XLSXUtils.json_to_sheet(rows);
    const wb = XLSXUtils.book_new();
    XLSXUtils.book_append_sheet(wb, ws, t("products.title"));
    XLSXWriteFile(wb, "products.xlsx");
  };

  const exportPdf = () => {
    const pdf = new jsPDF();
    const rows = (selectedProducts.length ? selectedProducts : products).map((product) => [
      product.title,
      categoryLabel(product, language),
      product.company?.name || product.user?.name || t("products.globalOwner"),
      statusLabel(product.status),
      product.price ?? "-",
      product.city || "-",
      new Date(product.createdAt).toLocaleDateString(locale),
    ]);
    autoTable(pdf, {
      head: [[
        t("products.col.title"),
        t("products.col.category"),
        t("products.col.owner"),
        t("products.col.status"),
        t("products.col.price"),
        t("products.col.location"),
        t("products.col.created"),
      ]],
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
        title={pendingOnly ? t("products.pendingTitle") : t("products.title")}
        subtitle={pendingOnly ? t("products.pendingSubtitle") : t("products.subtitle")}
        action={
          !pendingOnly ? (
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditProduct(null);
                setFormOpen(true);
              }}
            >
              {t("products.add")}
            </Button>
          ) : undefined
        }
      />

      <FilterBar>
        <TextField
          size="small"
          placeholder={t("products.search")}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: { xs: "100%", sm: 260 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          label={t("products.filterStatus")}
          size="small"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          sx={{ minWidth: 180 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Tune fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        >
          <MenuItem value="">{t("products.allStatuses")}</MenuItem>
          <MenuItem value="DRAFT">{t("products.status.DRAFT")}</MenuItem>
          <MenuItem value="PENDING">{t("products.status.PENDING")}</MenuItem>
          <MenuItem value="ACTIVE">{t("products.status.ACTIVE")}</MenuItem>
          <MenuItem value="REJECTED">{t("products.status.REJECTED")}</MenuItem>
          <MenuItem value="SOLD">{t("products.status.SOLD")}</MenuItem>
          <MenuItem value="EXPIRED">{t("products.status.EXPIRED")}</MenuItem>
        </TextField>
        <Stack direction="row" spacing={1} sx={{ marginInlineStart: { sm: "auto" }, flexWrap: "wrap" }}>
          <Button variant="outlined" startIcon={<Download />} onClick={exportExcel}>
            {t("products.exportExcel")}
          </Button>
          <Button variant="outlined" startIcon={<Download />} onClick={exportPdf}>
            {t("products.exportPdf")}
          </Button>
        </Stack>
      </FilterBar>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", alignItems: "center" }}>
          <Button
            variant="outlined"
            size="small"
            onClick={() => runBulk("approve")}
            disabled={!selected.length || bulkMutation.isPending}
          >
            {t("products.bulkApprove")}
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => runBulk("reject")}
            disabled={!selected.length || bulkMutation.isPending}
          >
            {t("products.bulkReject")}
          </Button>
          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={() => runBulk("delete")}
            disabled={!selected.length || deleteMutation.isPending}
          >
            {t("products.bulkDelete")}
          </Button>
          <TextField
            size="small"
            placeholder={t("products.rejectNote")}
            value={rejectNote}
            onChange={(e) => setRejectNote(e.target.value)}
            sx={{ minWidth: 200 }}
          />
          <Typography variant="caption" color="text.secondary">
            {selected.length} {t("products.selectedCount")}
          </Typography>
        </Stack>
      </Paper>

      {isLoading ? (
        <Stack sx={{ py: 4, alignItems: "center" }}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}
      {isError ? (
        <EmptyState title={t("products.loadFailed")} description={(error as Error).message} />
      ) : null}
      {!isLoading && !isError && !products.length ? (
        <EmptyState title={t("products.empty")} description={t("products.emptyHint")} />
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
                <AppTableHeaderCell>{t("products.col.images")}</AppTableHeaderCell>
                <AppTableHeaderCell>{t("products.col.title")}</AppTableHeaderCell>
                <AppTableHeaderCell>{t("products.col.category")}</AppTableHeaderCell>
                <AppTableHeaderCell>{t("products.col.owner")}</AppTableHeaderCell>
                <AppTableHeaderCell>{t("products.col.status")}</AppTableHeaderCell>
                <AppTableHeaderCell>{t("products.col.price")}</AppTableHeaderCell>
                <AppTableHeaderCell>{t("products.col.location")}</AppTableHeaderCell>
                <AppTableHeaderCell>{t("products.col.created")}</AppTableHeaderCell>
                <AppTableHeaderCell>{t("products.col.actions")}</AppTableHeaderCell>
              </tr>
            </AppTableHead>
            <tbody>
              {products.map((product) => (
                <AppTableRow key={product.id}>
                  <AppTableCell>
                    <Checkbox
                      size="small"
                      checked={selected.includes(product.id)}
                      onChange={() => toggleSelect(product.id)}
                    />
                  </AppTableCell>
                  <AppTableCell>
                    {product.images?.[0]?.path ? (
                      <Box
                        component="img"
                        src={resolveAssetUrl(product.images[0].path)}
                        alt={product.title}
                        sx={{ height: 40, width: 40, borderRadius: 1, objectFit: "cover" }}
                      />
                    ) : (
                      <Box sx={{ height: 40, width: 40, borderRadius: 1, bgcolor: "action.hover" }} />
                    )}
                  </AppTableCell>
                  <AppTableCell className="font-medium">{product.title}</AppTableCell>
                  <AppTableCell>{categoryLabel(product, language)}</AppTableCell>
                  <AppTableCell>
                    {product.company?.name || product.user?.name || t("products.globalOwner")}
                  </AppTableCell>
                  <AppTableCell>
                    <Chip
                      size="small"
                      label={statusLabel(product.status)}
                      color={statusChipColor(product.status)}
                      variant="outlined"
                    />
                  </AppTableCell>
                  <AppTableCell>
                    {product.price ? `${t("market.currency")} ${product.price}` : "-"}
                  </AppTableCell>
                  <AppTableCell>{product.city || "-"}</AppTableCell>
                  <AppTableCell>{new Date(product.createdAt).toLocaleDateString(locale)}</AppTableCell>
                  <AppTableCell>
                    <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => setDrawerProduct(product)}
                        title={t("products.view")}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      {!pendingOnly ? (
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditProduct(product);
                            setFormOpen(true);
                          }}
                          title={t("products.edit")}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      ) : null}
                      <Button
                        size="small"
                        color="success"
                        disabled={!canModerate(product.status)}
                        onClick={() => approveMutation.mutate(product.id)}
                      >
                        {t("products.approve")}
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        disabled={!canModerate(product.status)}
                        onClick={() => rejectMutation.mutate({ id: product.id, adminNote: rejectNote })}
                      >
                        {t("products.reject")}
                      </Button>
                      {!pendingOnly ? (
                        <IconButton size="small" color="error" onClick={() => setConfirmDeleteId(product.id)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      ) : null}
                    </Stack>
                  </AppTableCell>
                </AppTableRow>
              ))}
            </tbody>
          </AppTable>

          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="body2" color="text.secondary">
              {t("products.page")} {page} {t("products.of")} {totalPages}{" "}
              {isFetching ? `(${t("products.refreshing")})` : ""}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("products.previous")}
              </Button>
              <Button
                variant="outlined"
                size="small"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                {t("products.next")}
              </Button>
            </Stack>
          </Stack>
        </>
      ) : null}

      <AppDrawer
        open={Boolean(drawerProduct)}
        onClose={() => setDrawerProduct(null)}
        title={t("products.detailsTitle")}
        footer={
          drawerProduct ? (
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                disabled={!canModerate(drawerProduct.status)}
                onClick={() => {
                  approveMutation.mutate(drawerProduct.id);
                  setDrawerProduct(null);
                }}
              >
                {t("products.approve")}
              </Button>
              <Button
                variant="outlined"
                disabled={!canModerate(drawerProduct.status)}
                onClick={() => {
                  rejectMutation.mutate({ id: drawerProduct.id, adminNote: rejectNote });
                  setDrawerProduct(null);
                }}
              >
                {t("products.reject")}
              </Button>
              <Button onClick={() => setDrawerProduct(null)}>{t("products.close")}</Button>
            </Stack>
          ) : null
        }
      >
        {drawerProduct ? (
          <Stack spacing={2}>
            {drawerProduct.images?.length ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {drawerProduct.images.map((img) => (
                  <Box
                    key={img.id}
                    component="img"
                    src={resolveAssetUrl(img.path)}
                    alt=""
                    sx={{ height: 80, width: 80, borderRadius: 1, objectFit: "cover" }}
                  />
                ))}
              </Stack>
            ) : null}
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("products.field.title")}:
              </Box>{" "}
              {drawerProduct.title}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("products.field.category")}:
              </Box>{" "}
              {categoryLabel(drawerProduct, language)}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("products.field.owner")}:
              </Box>{" "}
              {drawerProduct.company?.name || drawerProduct.user?.name || t("products.globalOwner")}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("products.field.status")}:
              </Box>{" "}
              {statusLabel(drawerProduct.status)}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("products.field.price")}:
              </Box>{" "}
              {drawerProduct.price ? `${t("market.currency")} ${drawerProduct.price}` : "-"}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("products.field.location")}:
              </Box>{" "}
              {drawerProduct.city || "-"}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("products.field.created")}:
              </Box>{" "}
              {new Date(drawerProduct.createdAt).toLocaleString(locale)}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("products.field.description")}:
              </Box>{" "}
              {drawerProduct.description || "-"}
            </Typography>
          </Stack>
        ) : null}
      </AppDrawer>

      <AppDrawer
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        title={t("products.confirmDelete")}
        footer={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="error"
              onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}
            >
              {t("products.delete")}
            </Button>
            <Button onClick={() => setConfirmDeleteId(null)}>{t("products.cancel")}</Button>
          </Stack>
        }
      >
        <Typography variant="body2">{t("products.confirmDeleteMsg")}</Typography>
      </AppDrawer>

      {!pendingOnly ? (
        <ProductFormDrawer
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setEditProduct(null);
          }}
          onSuccess={invalidate}
          scope="admin"
          product={editProduct}
        />
      ) : null}
    </Stack>
  );
}
