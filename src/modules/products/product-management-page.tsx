import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add, Download, Search, Tune } from "@mui/icons-material";
import {
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { utils as XLSXUtils, writeFile as XLSXWriteFile } from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  AppModal,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
  AppTableRow,
} from "../../components/design-system";
import { EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  bulkReviewProductsApi,
  deleteProductApi,
  fetchAdminProducts,
  reviewProductApi,
  setProductMostRequestedApi,
  type AdminProduct,
} from "../../services/admin-api";
import {
  categoryLabel,
  invalidateProductQueries,
  ProductImageThumb,
  ProductRowActions,
  statusChipColor,
} from "./product-shared";

type ProductStatus = AdminProduct["status"];

function formatSelectedLabel(template: string, count: number) {
  return template.replace("{{count}}", String(count));
}

export function ProductManagementPage() {
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [rejectNote, setRejectNote] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const limit = 20;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const statusLabel = (value: ProductStatus) =>
    t(`products.status.${value}` as "products.status.PENDING");

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["admin-products-catalog", debouncedSearch, status, page],
    queryFn: () =>
      fetchAdminProducts({
        page,
        limit,
        search: debouncedSearch || undefined,
        status: status || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    placeholderData: (previousData) => previousData,
  });

  const products = data?.items || [];
  const totalPages = data?.meta?.totalPages || 1;
  const selectedProducts = useMemo(
    () => products.filter((product) => selected.includes(product.id)),
    [products, selected]
  );

  const invalidate = () => invalidateProductQueries(queryClient);

  const approveMutation = useMutation({
    mutationFn: (id: string) => reviewProductApi(id, { action: "APPROVE" }),
    onSuccess: invalidate,
  });
  const rejectMutation = useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      reviewProductApi(id, { action: "REJECT", adminNote: adminNote || t("products.defaultRejectNote") }),
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
  const mostRequestedMutation = useMutation({
    mutationFn: ({ id, isFeaturedMostRequested }: { id: string; isFeaturedMostRequested: boolean }) =>
      setProductMostRequestedApi(id, { isFeaturedMostRequested }),
    onSuccess: invalidate,
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
      adminNote: rejectNote.trim() || t("products.defaultRejectNote"),
    });
  };

  if (isLoading && !data) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader
        title={t("products.title")}
        subtitle={t("products.subtitle")}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/products/new")}>
            {t("products.add")}
          </Button>
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
              endAdornment: isFetching ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : undefined,
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
            {formatSelectedLabel(t("products.selected"), selected.length)}
          </Typography>
        </Stack>
      </Paper>

      {isError ? (
        <EmptyState title={t("products.loadFailed")} description={(error as Error).message} />
      ) : null}
      {!isError && !products.length ? (
        <EmptyState
          title={debouncedSearch || status ? t("products.noResults") : t("products.empty")}
          description={t("products.emptyHint")}
        />
      ) : null}

      {!isError && products.length > 0 ? (
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
                <AppTableHeaderCell>{t("products.col.mostRequested")}</AppTableHeaderCell>
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
                    <ProductImageThumb product={product} />
                  </AppTableCell>
                  <AppTableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {product.title}
                    </Typography>
                  </AppTableCell>
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
                    <Switch
                      size="small"
                      checked={Boolean(product.isFeaturedMostRequested)}
                      disabled={product.status !== "ACTIVE" || mostRequestedMutation.isPending}
                      onChange={(e) =>
                        mostRequestedMutation.mutate({
                          id: product.id,
                          isFeaturedMostRequested: e.target.checked,
                        })
                      }
                    />
                  </AppTableCell>
                  <AppTableCell>
                    {product.price ? `${t("market.currency")} ${product.price}` : "-"}
                  </AppTableCell>
                  <AppTableCell>{product.city || "-"}</AppTableCell>
                  <AppTableCell>{new Date(product.createdAt).toLocaleDateString(locale)}</AppTableCell>
                  <AppTableCell>
                    <ProductRowActions
                      product={product}
                      language={language}
                      t={t}
                      onView={() => navigate(`/products/${product.id}`)}
                      onApprove={() => approveMutation.mutate(product.id)}
                      onReject={() =>
                        rejectMutation.mutate({
                          id: product.id,
                          adminNote: rejectNote.trim() || t("products.defaultRejectNote"),
                        })
                      }
                      onEdit={() => navigate(`/products/${product.id}/edit`)}
                      onDelete={() => setConfirmDeleteId(product.id)}
                      approvePending={approveMutation.isPending}
                      rejectPending={rejectMutation.isPending}
                    />
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

      <AppModal
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        title={t("products.confirmDelete")}
        footer={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="error"
              onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}
              sx={{ borderRadius: "8px" }}
            >
              {t("products.delete")}
            </Button>
            <Button onClick={() => setConfirmDeleteId(null)} sx={{ borderRadius: "8px" }}>
              {t("products.cancel")}
            </Button>
          </Stack>
        }
      >
        <Typography variant="body2">{t("products.confirmDeleteMsg")}</Typography>
      </AppModal>
    </Stack>
  );
}
