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

export function CategoriesPage() {
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
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim() || undefined,
        sortOrder: Number(form.sortOrder) || 0,
        isActive: form.isActive,
      };
      if (editingId) return updateAdminCategoryApi(editingId, payload);
      return createAdminCategoryApi(payload);
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories-all"] });
      setForm(emptyForm);
      setEditingId(null);
      if (!selectedCategoryId && saved?.id) setSelectedCategoryId(saved.id);
      toast.success(editingId ? "Category updated" : "Category created");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to save category"),
  });

  const deleteMutation = useMutation({
    mutationFn: (categoryId: string) => deleteAdminCategoryApi(categoryId),
    onSuccess: (_data, categoryId) => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin-categories-all"] });
      if (selectedCategoryId === categoryId) setSelectedCategoryId("");
      if (editingId === categoryId) {
        setEditingId(null);
        setForm(emptyForm);
      }
      toast.success("Category deleted");
    },
    onError: (err: unknown) => toast.error(err instanceof Error ? err.message : "Failed to delete category"),
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
      <PageHeader
        title="Categories"
        subtitle="Add categories and configure dynamic form fields in one place."
      />

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Arabic name *"
              fullWidth
              size="small"
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              placeholder="محاصيل"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="English name"
              fullWidth
              size="small"
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              placeholder="Crops"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <TextField
              label="Sort order"
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
              label="Status"
              fullWidth
              size="small"
              value={form.isActive ? "true" : "false"}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "true" }))}
            >
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => saveMutation.mutate()}
            disabled={!form.nameAr.trim() || saveMutation.isPending}
          >
            {editingId ? "Update category" : "Add category"}
          </Button>
          {editingId ? (
            <Button variant="outlined" onClick={cancelEdit}>
              Cancel edit
            </Button>
          ) : null}
        </Stack>
      </Paper>

      {isLoading ? (
        <Stack sx={{ py: 4, alignItems: "center" }}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      {isError ? <EmptyState title="Failed to load categories" description={(error as Error).message} /> : null}

      {!isLoading && !isError ? (
        <PageSection title="All categories">
          <AppTable>
            <AppTableHead>
              <tr>
                <AppTableHeaderCell>Arabic</AppTableHeaderCell>
                <AppTableHeaderCell>English</AppTableHeaderCell>
                <AppTableHeaderCell>Sort</AppTableHeaderCell>
                <AppTableHeaderCell>Status</AppTableHeaderCell>
                <AppTableHeaderCell>Actions</AppTableHeaderCell>
              </tr>
            </AppTableHead>
            <tbody>
              {categories.length ? (
                categories.map((category) => (
                  <AppTableRow key={category.id}>
                    <AppTableCell>{category.nameAr || "-"}</AppTableCell>
                    <AppTableCell>{category.nameEn || "-"}</AppTableCell>
                    <AppTableCell>{category.sortOrder ?? 0}</AppTableCell>
                    <AppTableCell>
                      <AppBadge variant={category.isActive ? "success" : "neutral"}>
                        {category.isActive ? "Active" : "Inactive"}
                      </AppBadge>
                    </AppTableCell>
                    <AppTableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          size="small"
                          variant={selectedCategoryId === category.id ? "contained" : "outlined"}
                          onClick={() => setSelectedCategoryId(category.id)}
                        >
                          Fields
                        </Button>
                        <IconButton size="small" onClick={() => startEdit(category)}>
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            if (window.confirm(`Delete category "${category.nameAr}"?`)) {
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
                  <td colSpan={5}>
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: "center" }}>
                      No categories yet. Add one above.
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
        categoryLabel={selectedCategory?.nameAr || selectedCategory?.nameEn}
      />
    </Stack>
  );
}
