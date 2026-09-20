import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add } from "@mui/icons-material";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AppBadge,
  AppModal,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
  AppTableRow,
  TableBody,
} from "../../components/design-system";
import { EmptyState, PageHeader, TablePaginationBar, TableRowActions, resolveTotalPages } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { toast } from "../../components/ui/sonner";
import {
  createAdminCategoryApi,
  deleteAdminCategoryApi,
  fetchAdminCategories,
  fetchAdminUnits,
  updateAdminCategoryApi,
  uploadAdminCategoryImageApi,
  type AdminCategory,
  type AdminUnit,
} from "../../services/admin-api";
import { CategoryFieldsBuilder } from "./category-fields-builder";
import {
  CategoryImagePicker,
  resolveCategoryImagePath,
  type CategoryImageState,
} from "./category-image-picker";
import { resolveAssetUrl } from "../../utils/asset-url";

const emptyForm = {
  nameAr: "",
  nameEn: "",
  sortOrder: "0",
  allowsAdvertisement: false,
  requiresGovernorate: false,
  isActive: true,
  unitIds: [] as string[],
};

const fieldSx = { "& .MuiOutlinedInput-root": { borderRadius: "8px" } };

function categoryDisplayName(category: AdminCategory, language: "ar" | "en") {
  if (language === "ar") return category.nameAr || category.nameEn || "-";
  return category.nameEn || category.nameAr || "-";
}

export function CategoriesPage() {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [imageState, setImageState] = useState<CategoryImageState>({ kind: "none" });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["admin-categories-list", page, pageSize],
    queryFn: () =>
      fetchAdminCategories({ page, limit: pageSize, sortBy: "sortOrder", sortOrder: "asc" }),
    placeholderData: (previousData) =>
      previousData && Array.isArray(previousData.items) ? previousData : undefined,
  });

  const { data: unitsData } = useQuery({
    queryKey: ["admin-units-options"],
    queryFn: () => fetchAdminUnits({ page: 1, limit: 100, sortBy: "sortOrder", sortOrder: "asc" }),
  });
  const allUnits = (unitsData?.items || []).filter((unit) => unit.isActive !== false);

  const categories = Array.isArray(data?.items) ? data.items : [];
  const totalPages = resolveTotalPages(data?.meta);
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const isEditing = Boolean(editingId);
  const selectedUnits = allUnits.filter((unit) => form.unitIds.includes(unit.id));

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.nameEn.trim()) throw new Error(t("categories.nameEnRequired"));
      const image = await resolveCategoryImagePath(imageState, uploadAdminCategoryImageApi);
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        allowsAdvertisement: form.allowsAdvertisement,
        requiresGovernorate: form.requiresGovernorate,
        isActive: form.isActive,
        unitIds: form.unitIds,
        ...(image !== null ? { image } : editingId ? { image: null } : {}),
      };
      if (editingId) return updateAdminCategoryApi(editingId, payload);
      return createAdminCategoryApi(payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories-all"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      const wasEdit = Boolean(editingId);
      closeModal();
      if (!selectedCategoryId && saved?.id) setSelectedCategoryId(saved.id);
      toast.success(wasEdit ? t("categories.updated") : t("categories.created"));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("categories.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => deleteAdminCategoryApi(categoryId),
    onSuccess: (_data, categoryId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories-list"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories-all"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      if (selectedCategoryId === categoryId) setSelectedCategoryId("");
      if (editingId === categoryId) closeModal();
      toast.success(t("categories.deleted"));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("categories.deleteFailed")),
  });

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setImageState({ kind: "none" });
    setModalOpen(true);
  }

  function openEdit(category: AdminCategory) {
    setEditingId(category.id);
    setSelectedCategoryId(category.id);
    setForm({
      nameAr: category.nameAr || "",
      nameEn: category.nameEn || "",
      sortOrder: String(category.sortOrder ?? 0),
      allowsAdvertisement: category.allowsAdvertisement === true,
      requiresGovernorate: category.requiresGovernorate === true,
      isActive: category.isActive !== false,
      unitIds: category.unitIds || category.units?.map((unit) => unit.id) || [],
    });
    setImageState(category.image ? { kind: "existing", path: category.image } : { kind: "none" });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
    setImageState({ kind: "none" });
  }

  return (
    <Stack spacing={2.5} sx={{ width: "100%", pb: 2 }}>
      <PageHeader
        title={t("categories.title")}
        subtitle={t("categories.subtitle")}
        action={
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={openCreate}
            sx={{ borderRadius: "8px" }}
          >
            {t("categories.add")}
          </Button>
        }
      />

      {isLoading ? (
        <Stack sx={{ py: 8, alignItems: "center" }}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      {isError ? (
        <EmptyState title={t("categories.loadFailed")} description={(error as Error).message} />
      ) : null}

      {!isLoading && !isError ? (
        <AppTable minWidth={880}>
          <AppTableHead>
            <AppTableRow hover={false}>
              <AppTableHeaderCell width={72}>{t("categories.col.image")}</AppTableHeaderCell>
              <AppTableHeaderCell sx={{ minWidth: 160 }}>{t("categories.col.name")}</AppTableHeaderCell>
              <AppTableHeaderCell width={80}>{t("categories.col.sort")}</AppTableHeaderCell>
              <AppTableHeaderCell sx={{ minWidth: 140 }}>{t("categories.col.units")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("categories.col.adType")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("categories.col.status")}</AppTableHeaderCell>
              <AppTableHeaderCell align="right" width={200}>
                {t("categories.col.actions")}
              </AppTableHeaderCell>
            </AppTableRow>
          </AppTableHead>
          <TableBody>
            {categories.length ? (
              categories.map((category) => (
                <AppTableRow key={category.id}>
                  <AppTableCell>
                    {category.image ? (
                      <Box
                        component="img"
                        src={resolveAssetUrl(category.image)}
                        alt=""
                        sx={{
                          width: 40,
                          height: 40,
                          objectFit: "cover",
                          borderRadius: "8px",
                          border: 1,
                          borderColor: "divider",
                        }}
                      />
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </AppTableCell>
                  <AppTableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {categoryDisplayName(category, language)}
                    </Typography>
                    {language === "ar" && category.nameEn ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {category.nameEn}
                      </Typography>
                    ) : null}
                    {language === "en" && category.nameAr ? (
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {category.nameAr}
                      </Typography>
                    ) : null}
                  </AppTableCell>
                  <AppTableCell>{category.sortOrder ?? 0}</AppTableCell>
                  <AppTableCell>
                    {(category.units || []).length ? (
                      <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                        {(category.units || []).map((unit) => (
                          <Chip key={unit.id} size="small" label={unit.symbol} sx={{ borderRadius: "8px" }} />
                        ))}
                      </Stack>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        —
                      </Typography>
                    )}
                  </AppTableCell>
                  <AppTableCell>
                    <AppBadge variant={category.allowsAdvertisement ? "success" : "neutral"}>
                      {category.allowsAdvertisement
                        ? t("categories.adType.advertisement")
                        : t("categories.adType.ecommerce")}
                    </AppBadge>
                  </AppTableCell>
                  <AppTableCell>
                    <AppBadge variant={category.isActive !== false ? "success" : "neutral"}>
                      {category.isActive !== false ? t("categories.active") : t("categories.inactive")}
                    </AppBadge>
                  </AppTableCell>
                  <AppTableCell align="right">
                    <Stack
                      direction="row"
                      spacing={0.75}
                      useFlexGap
                      sx={{ alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap" }}
                    >
                      <Button
                        size="small"
                        variant={selectedCategoryId === category.id ? "contained" : "outlined"}
                        onClick={() => setSelectedCategoryId(category.id)}
                        sx={{ borderRadius: "8px" }}
                      >
                        {t("categories.fields")}
                      </Button>
                      <TableRowActions
                        onEdit={() => openEdit(category)}
                        onDelete={() => {
                          const name = categoryDisplayName(category, language);
                          if (window.confirm(t("categories.deleteConfirm").replace("{{name}}", name))) {
                            deleteMutation.mutate(category.id);
                          }
                        }}
                      />
                    </Stack>
                  </AppTableCell>
                </AppTableRow>
              ))
            ) : (
              <AppTableRow hover={false}>
                <AppTableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                    {t("categories.empty")}
                  </Typography>
                </AppTableCell>
              </AppTableRow>
            )}
          </TableBody>
        </AppTable>
      ) : null}

      {!isLoading && !isError && (categories.length > 0 || totalPages > 1) ? (
        <TablePaginationBar
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
          isFetching={isFetching}
          totalItems={data?.meta?.total}
        />
      ) : null}

      <CategoryFieldsBuilder
        categoryId={selectedCategoryId}
        categoryLabel={selectedCategory ? categoryDisplayName(selectedCategory, language) : undefined}
      />

      <AppModal
        open={modalOpen}
        onClose={() => {
          if (!saveMutation.isPending) closeModal();
        }}
        maxWidth="md"
        title={isEditing ? t("categories.update") : t("categories.add")}
        description={t("categories.subtitle")}
        footer={
          <Stack direction="row" spacing={1} useFlexGap sx={{ width: "100%", justifyContent: "flex-end" }}>
            <Button
              variant="outlined"
              onClick={closeModal}
              disabled={saveMutation.isPending}
              sx={{ borderRadius: "8px" }}
            >
              {t("categories.cancelEdit")}
            </Button>
            <Button
              variant="contained"
              onClick={() => saveMutation.mutate()}
              disabled={!form.nameAr.trim() || !form.nameEn.trim() || saveMutation.isPending}
              sx={{ borderRadius: "8px", minWidth: 120 }}
            >
              {saveMutation.isPending ? (
                <CircularProgress size={18} color="inherit" />
              ) : isEditing ? (
                t("categories.update")
              ) : (
                t("categories.add")
              )}
            </Button>
          </Stack>
        }
      >
        <Stack spacing={2.25}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label={`${t("categories.nameAr")} *`}
              fullWidth
              size="small"
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              sx={fieldSx}
            />
            <TextField
              label={`${t("categories.nameEn")} *`}
              fullWidth
              size="small"
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              sx={fieldSx}
            />
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <TextField
              label={t("categories.sortOrder")}
              type="number"
              fullWidth
              size="small"
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
              sx={fieldSx}
            />
            <TextField
              select
              label={t("categories.status")}
              fullWidth
              size="small"
              value={form.isActive ? "true" : "false"}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "true" }))}
              sx={fieldSx}
            >
              <MenuItem value="true">{t("categories.active")}</MenuItem>
              <MenuItem value="false">{t("categories.inactive")}</MenuItem>
            </TextField>
          </Stack>

          <Autocomplete
            multiple
            options={allUnits}
            value={selectedUnits}
            onChange={(_event, value: AdminUnit[]) =>
              setForm((f) => ({ ...f, unitIds: value.map((unit) => unit.id) }))
            }
            getOptionLabel={(option) =>
              language === "ar"
                ? `${option.nameAr || option.nameEn || ""} (${option.symbol})`
                : `${option.nameEn || option.nameAr || ""} (${option.symbol})`
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option.id}
                  size="small"
                  label={option.symbol}
                  sx={{ borderRadius: "8px" }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label={t("categories.units")}
                helperText={t("categories.unitsHint")}
                sx={fieldSx}
              />
            )}
          />

          <Stack spacing={0.5}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={form.allowsAdvertisement}
                  onChange={(e) => setForm((f) => ({ ...f, allowsAdvertisement: e.target.checked }))}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t("categories.allowsAdvertisement")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("categories.allowsAdvertisementHint")}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: "flex-start", ml: 0, mr: 0 }}
            />
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={form.requiresGovernorate}
                  onChange={(e) => setForm((f) => ({ ...f, requiresGovernorate: e.target.checked }))}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {t("categories.requiresGovernorate")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t("categories.requiresGovernorateHint")}
                  </Typography>
                </Box>
              }
              sx={{ alignItems: "flex-start", ml: 0, mr: 0 }}
            />
          </Stack>

          <CategoryImagePicker
            value={imageState}
            onChange={setImageState}
            label={t("categories.image")}
            hint={t("categories.imageHint")}
            addLabel={t("categories.imageAdd")}
            disabled={saveMutation.isPending}
          />
        </Stack>
      </AppModal>
    </Stack>
  );
}
