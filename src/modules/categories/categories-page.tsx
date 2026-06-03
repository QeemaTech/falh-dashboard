import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import {
  AppBadge,
  AppSelect,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
  AppTableRow,
} from "../../components/design-system";
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
    <div className="min-w-0 space-y-6 overflow-x-hidden">
      <Card className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Categories</h2>
            <p className="text-sm text-neutral-500">Add categories and configure dynamic form fields in one place.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium">Arabic name *</label>
            <Input
              value={form.nameAr}
              onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))}
              placeholder="محاصيل"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-medium">English name</label>
            <Input
              value={form.nameEn}
              onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))}
              placeholder="Crops"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Sort order</label>
            <Input
              type="number"
              min={0}
              step={1}
              value={form.sortOrder}
              onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Status</label>
            <AppSelect
              value={form.isActive ? "true" : "false"}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.value === "true" }))}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </AppSelect>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!form.nameAr.trim() || saveMutation.isPending}
          >
            <Plus className="me-2 size-4" />
            {editingId ? "Update category" : "Add category"}
          </Button>
          {editingId ? (
            <Button variant="outline" onClick={cancelEdit}>
              Cancel edit
            </Button>
          ) : null}
        </div>
      </Card>

      {isLoading ? <Card>Loading categories...</Card> : null}
      {isError ? <Card>Failed to load categories: {(error as Error).message}</Card> : null}

      {!isLoading && !isError ? (
        <AppTable title="All categories">
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
                <AppTableRow
                  key={category.id}
                  className={selectedCategoryId === category.id ? "bg-[#23673A]/8" : undefined}
                >
                  <AppTableCell className="font-medium">{category.nameAr || "-"}</AppTableCell>
                  <AppTableCell>{category.nameEn || "-"}</AppTableCell>
                  <AppTableCell>{category.sortOrder ?? 0}</AppTableCell>
                  <AppTableCell>
                    <AppBadge variant={category.isActive ? "success" : "neutral"}>
                      {category.isActive ? "Active" : "Inactive"}
                    </AppBadge>
                  </AppTableCell>
                  <AppTableCell>
                    <div className="flex flex-wrap gap-1">
                      <Button
                        size="sm"
                        variant={selectedCategoryId === category.id ? "default" : "outline"}
                        onClick={() => setSelectedCategoryId(category.id)}
                      >
                        Fields
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => startEdit(category)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (window.confirm(`Delete category "${category.nameAr}"?`)) {
                            deleteMutation.mutate(category.id);
                          }
                        }}
                      >
                        <Trash2 className="size-4 text-red-500" />
                      </Button>
                    </div>
                  </AppTableCell>
                </AppTableRow>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-neutral-500">
                  No categories yet. Add one above.
                </td>
              </tr>
            )}
          </tbody>
        </AppTable>
      ) : null}

      <CategoryFieldsBuilder
        categoryId={selectedCategoryId}
        categoryLabel={selectedCategory?.nameAr || selectedCategory?.nameEn}
      />
    </div>
  );
}
