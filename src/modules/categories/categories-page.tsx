import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add, Delete, Edit } from "@mui/icons-material";
import {
  Button,
  CircularProgress,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AppBadge,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
  AppTableRow,
} from "../../components/design-system";
import { EmptyState, PageHeader, PageSection } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { toast } from "../../components/ui/sonner";
import {
  createAdminCategoryApi,
  deleteAdminCategoryApi,
  fetchAdminCategories,
  updateAdminCategoryApi,
  type AdminCategory,
} from "../../services/admin-api";
import { CategoryFieldsBuilder } from "./category-fields-builder";

const emptyForm = {
  nameAr: "",
  nameEn: "",
  sortOrder: "0",
  isActive: true,
};

function categoryDisplayName(category: AdminCategory, language: "ar" | "en") {
  if (language === "ar") return category.nameAr || category.nameEn || "-";
  return category.nameEn || category.nameAr || "-";
}

export function CategoriesPage() {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => fetchAdminCategories({ page: 1, limit: 100, sortBy: "sortOrder", sortOrder: "asc" }),
  });

  const categories = data || [];
  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.nameEn.trim()) throw new Error(t("categories.nameEnRequired"));
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editingId) return updateAdminCategoryApi(editingId, payload);
      return createAdminCategoryApi(payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories-all"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      setForm(emptyForm);
      setEditingId(null);
      if (!selectedCategoryId && saved?.id) setSelectedCategoryId(saved.id);
      toast.success(editingId ? t("categories.updated") : t("categories.created"));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("categories.saveFailed")),
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => deleteAdminCategoryApi(categoryId),
    onSuccess: (_data, categoryId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories-all"] });
      queryClient.invalidateQueries({ queryKey: ["product-categories"] });
      if (selectedCategoryId === categoryId) setSelectedCategoryId("");
      if (editingId === categoryId) {
        setEditingId(null);
        setForm(emptyForm);
      }
      toast.success(t("categories.deleted"));
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : t("categories.deleteFailed")),
  });

  function startEdit(category: AdminCategory) {
    setEditingId(category.id);
    setSelectedCategoryId(category.id);
    setForm({
      nameAr: category.nameAr || "",
      nameEn: category.nameEn || "",
      sortOrder: String(category.sortOrder ?? 0),
      isActive: category.isActive !== false,
    });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  return (
    <Stack spacing={3}>
      <PageHeader title={t("categories.title")} subtitle={t("categories.subtitle")} />

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={`${t("categories.nameAr")} *`}
              fullWidth
              size="small"
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label={`${t("categories.nameEn")} *`}
              fullWidth
              size="small"
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label={t("categories.sortOrder")}
              type="number"
              fullWidth
              size="small"
              slotProps={{ htmlInput: { min: 0, step: 1 } }}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              select
              label={t("categories.status")}
              fullWidth
              size="small"
              value={form.isActive ? "true" : "false"}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "true" }))}
            >
              <MenuItem value="true">{t("categories.active")}</MenuItem>
              <MenuItem value="false">{t("categories.inactive")}</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => saveMutation.mutate()}
            disabled={!form.nameAr.trim() || !form.nameEn.trim() || saveMutation.isPending}
          >
            {editingId ? t("categories.update") : t("categories.add")}
          </Button>
          {editingId ? (
            <Button variant="outlined" onClick={cancelEdit}>
              {t("categories.cancelEdit")}
            </Button>
          ) : null}
        </Stack>
      </Paper>

      {isLoading ? (
        <Stack sx={{ py: 4, alignItems: "center" }}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      {isError ? (
        <EmptyState title={t("categories.loadFailed")} description={(error as Error).message} />
      ) : null}

      {!isLoading && !isError ? (
        <PageSection title={t("categories.allTitle")}>
          <AppTable>
            <AppTableHead>
              <tr>
                <AppTableHeaderCell>{t("categories.col.name")}</AppTableHeaderCell>
                <AppTableHeaderCell>{t("categories.col.sort")}</AppTableHeaderCell>
                <AppTableHeaderCell>{t("categories.col.status")}</AppTableHeaderCell>
                <AppTableHeaderCell>{t("categories.col.actions")}</AppTableHeaderCell>
              </tr>
            </AppTableHead>
            <tbody>
              {categories.length ? (
                categories.map((category) => (
                  <AppTableRow key={category.id}>
                    <AppTableCell>{categoryDisplayName(category, language)}</AppTableCell>
                    <AppTableCell>{category.sortOrder ?? 0}</AppTableCell>
                    <AppTableCell>
                      <AppBadge variant={category.isActive ? "success" : "neutral"}>
                        {category.isActive ? t("categories.active") : t("categories.inactive")}
                      </AppBadge>
                    </AppTableCell>
                    <AppTableCell>
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <Button
                          size="small"
                          variant={selectedCategoryId === category.id ? "contained" : "outlined"}
                          onClick={() => setSelectedCategoryId(category.id)}
                        >
                          {t("categories.fields")}
                        </Button>
                        <IconButton size="small" onClick={() => startEdit(category)} aria-label={t("categories.update")}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={t("categories.deleted")}
                          onClick={() => {
                            const name = categoryDisplayName(category, language);
                            if (window.confirm(t("categories.deleteConfirm").replace("{{name}}", name))) {
                              deleteMutation.mutate(category.id);
                            }
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </AppTableCell>
                  </AppTableRow>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                      {t("categories.empty")}
                    </Typography>
                  </td>
                </tr>
              )}
            </tbody>
          </AppTable>
        </PageSection>
      ) : null}

      <CategoryFieldsBuilder
        categoryId={selectedCategoryId}
        categoryLabel={selectedCategory ? categoryDisplayName(selectedCategory, language) : undefined}
      />
    </Stack>
  );
}
