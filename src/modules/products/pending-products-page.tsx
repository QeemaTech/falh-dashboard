import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Business, Search } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
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
  fetchAdminProducts,
  reviewProductApi,
  type AdminProduct,
} from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import {
  categoryLabel,
  groupProductsByCompany,
  invalidateProductQueries,
  ProductImageThumb,
  ProductRowActions,
  sortedProductImages,
} from "./product-shared";

function formatSelectedLabel(template: string, count: number) {
  return template.replace("{{count}}", String(count));
}

export function PendingProductsPage() {
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [drawerProduct, setDrawerProduct] = useState<AdminProduct | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["admin-pending-products", debouncedSearch],
    queryFn: () =>
      fetchAdminProducts({
        page: 1,
        limit: 200,
        search: debouncedSearch || undefined,
        status: "PENDING",
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    placeholderData: (previousData) => previousData,
  });

  const products = data?.items || [];
  const companyGroups = useMemo(
    () => groupProductsByCompany(products, t("products.globalOwner")),
    [products, t]
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
  const bulkMutation = useMutation({
    mutationFn: (payload: { productIds: string[]; action: "APPROVE" | "REJECT"; adminNote?: string }) =>
      bulkReviewProductsApi(payload),
    onSuccess: (_data, variables) => {
      setSelected((prev) => prev.filter((id) => !variables.productIds.includes(id)));
      invalidate();
    },
  });

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));
  };

  const toggleCompanySelect = (productIds: string[]) => {
    const allSelected = productIds.every((id) => selected.includes(id));
    if (allSelected) {
      setSelected((prev) => prev.filter((id) => !productIds.includes(id)));
      return;
    }
    setSelected((prev) => [...new Set([...prev, ...productIds])]);
  };

  const runCompanyBulk = async (productIds: string[], action: "approve" | "reject") => {
    if (!productIds.length) return;
    await bulkMutation.mutateAsync({
      productIds,
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

  if (isError) {
    return <EmptyState title={t("products.loadFailed")} description={(error as Error).message} />;
  }

  return (
    <Stack spacing={3}>
      <PageHeader title={t("products.pendingTitle")} subtitle={t("products.pendingSubtitle")} />

      <FilterBar>
        <TextField
          size="small"
          placeholder={t("products.pendingSearch")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 280 } }}
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
          size="small"
          placeholder={t("products.rejectNote")}
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 260 } }}
        />
      </FilterBar>

      {!companyGroups.length ? (
        <EmptyState title={t("products.pendingEmpty")} description={t("products.pendingEmptyHint")} />
      ) : (
        companyGroups.map((group) => {
          const groupIds = group.products.map((product) => product.id);
          const allGroupSelected = groupIds.length > 0 && groupIds.every((id) => selected.includes(id));
          const someGroupSelected = groupIds.some((id) => selected.includes(id));

          return (
            <Paper key={group.key} variant="outlined" sx={{ overflow: "hidden" }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1.5}
                sx={{
                  px: 2,
                  py: 1.5,
                  alignItems: { sm: "center" },
                  justifyContent: "space-between",
                  bgcolor: "action.hover",
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <Checkbox
                    size="small"
                    checked={allGroupSelected}
                    indeterminate={someGroupSelected && !allGroupSelected}
                    onChange={() => toggleCompanySelect(groupIds)}
                  />
                  <Box
                    sx={{
                      p: 0.75,
                      borderRadius: 1,
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      display: "grid",
                      placeItems: "center",
                    }}
                  >
                    <Business fontSize="small" />
                  </Box>
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      {group.companyName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatSelectedLabel(t("products.pendingCount"), group.products.length)}
                    </Typography>
                  </Box>
                </Stack>
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  <Button
                    size="small"
                    variant="outlined"
                    color="success"
                    disabled={bulkMutation.isPending}
                    onClick={() => runCompanyBulk(groupIds, "approve")}
                  >
                    {t("products.approveAll")}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="error"
                    disabled={bulkMutation.isPending}
                    onClick={() => runCompanyBulk(groupIds, "reject")}
                  >
                    {t("products.rejectAll")}
                  </Button>
                </Stack>
              </Stack>

              <AppTable>
                <AppTableHead>
                  <tr>
                    <AppTableHeaderCell />
                    <AppTableHeaderCell>{t("products.col.images")}</AppTableHeaderCell>
                    <AppTableHeaderCell>{t("products.col.title")}</AppTableHeaderCell>
                    <AppTableHeaderCell>{t("products.col.category")}</AppTableHeaderCell>
                    <AppTableHeaderCell>{t("products.col.price")}</AppTableHeaderCell>
                    <AppTableHeaderCell>{t("products.col.location")}</AppTableHeaderCell>
                    <AppTableHeaderCell>{t("products.col.created")}</AppTableHeaderCell>
                    <AppTableHeaderCell>{t("products.col.actions")}</AppTableHeaderCell>
                  </tr>
                </AppTableHead>
                <tbody>
                  {group.products.map((product) => (
                    <AppTableRow key={product.id}>
                      <AppTableCell>
                        <Checkbox
                          size="small"
                          checked={selected.includes(product.id)}
                          onChange={() => toggleSelect(product.id)}
                        />
                      </AppTableCell>
                      <AppTableCell>
                        <ProductImageThumb product={product} size={52} />
                      </AppTableCell>
                      <AppTableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {product.title}
                        </Typography>
                      </AppTableCell>
                      <AppTableCell>{categoryLabel(product, language)}</AppTableCell>
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
                          onView={() => setDrawerProduct(product)}
                          onApprove={() => approveMutation.mutate(product.id)}
                          onReject={() =>
                            rejectMutation.mutate({
                              id: product.id,
                              adminNote: rejectNote.trim() || t("products.defaultRejectNote"),
                            })
                          }
                          approvePending={approveMutation.isPending}
                          rejectPending={rejectMutation.isPending}
                        />
                      </AppTableCell>
                    </AppTableRow>
                  ))}
                </tbody>
              </AppTable>
            </Paper>
          );
        })
      )}

      {selected.length > 0 ? (
        <Paper sx={{ p: 2, position: "sticky", bottom: 16, zIndex: 2 }}>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <Chip label={formatSelectedLabel(t("products.selected"), selected.length)} size="small" />
            <Button
              size="small"
              variant="contained"
              color="success"
              disabled={bulkMutation.isPending}
              onClick={() =>
                bulkMutation.mutate({
                  productIds: selected,
                  action: "APPROVE",
                })
              }
            >
              {t("products.bulkApprove")}
            </Button>
            <Button
              size="small"
              variant="outlined"
              color="error"
              disabled={bulkMutation.isPending}
              onClick={() =>
                bulkMutation.mutate({
                  productIds: selected,
                  action: "REJECT",
                  adminNote: rejectNote.trim() || t("products.defaultRejectNote"),
                })
              }
            >
              {t("products.bulkReject")}
            </Button>
            <Button size="small" onClick={() => setSelected([])}>
              {t("products.clearSelection")}
            </Button>
          </Stack>
        </Paper>
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
                color="success"
                disabled={approveMutation.isPending}
                onClick={() => {
                  approveMutation.mutate(drawerProduct.id);
                  setDrawerProduct(null);
                }}
              >
                {t("products.approve")}
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={rejectMutation.isPending}
                onClick={() => {
                  rejectMutation.mutate({
                    id: drawerProduct.id,
                    adminNote: rejectNote.trim() || t("products.defaultRejectNote"),
                  });
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
            {sortedProductImages(drawerProduct).length ? (
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                {sortedProductImages(drawerProduct).map((img) => (
                  <Box
                    key={img.id}
                    component="img"
                    src={resolveAssetUrl(img.path)}
                    alt=""
                    sx={{ height: 88, width: 88, borderRadius: 1, objectFit: "cover", border: 1, borderColor: "divider" }}
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
                {t("products.field.company")}:
              </Box>{" "}
              {drawerProduct.company?.name || t("products.globalOwner")}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("products.field.category")}:
              </Box>{" "}
              {categoryLabel(drawerProduct, language)}
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
            <Divider />
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("products.field.description")}:
              </Box>{" "}
              {drawerProduct.description || "-"}
            </Typography>
          </Stack>
        ) : null}
      </AppDrawer>
    </Stack>
  );
}
