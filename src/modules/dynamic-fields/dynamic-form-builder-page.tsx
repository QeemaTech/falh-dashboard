import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { AppSelect } from "../../components/design-system";
import {
  createDynamicFieldApi,
  deleteDynamicFieldApi,
  fetchAdminCategories,
  fetchCategoryDynamicFields,
  reorderDynamicFieldsApi,
  updateDynamicFieldApi,
  type DynamicField,
  type DynamicFieldType,
} from "../../services/admin-api";

const FIELD_TYPES: DynamicFieldType[] = [
  "TEXT",
  "NUMBER",
  "DATE",
  "SELECT",
  "RADIO",
  "FILE",
  "BOOLEAN",
  "TEXTAREA",
];

const exampleTemplates = {
  agriculturalLand: [
    { label: "Area", fieldKey: "area", fieldType: "NUMBER" as DynamicFieldType, isRequired: true },
    { label: "Water Source", fieldKey: "water_source", fieldType: "SELECT" as DynamicFieldType, isRequired: true },
    { label: "Ownership Type", fieldKey: "ownership_type", fieldType: "RADIO" as DynamicFieldType, isRequired: true },
  ],
  crop: [
    { label: "Production Date", fieldKey: "production_date", fieldType: "DATE" as DynamicFieldType, isRequired: true },
    { label: "Export Quality", fieldKey: "export_quality", fieldType: "BOOLEAN" as DynamicFieldType, isRequired: false },
  ],
};

function defaultField(type: DynamicFieldType): Omit<DynamicField, "id" | "categoryId"> {
  return {
    label: "New Field",
    labelEn: "",
    fieldKey: `field_${Date.now()}`,
    fieldType: type,
    placeholder: "",
    helpText: "",
    isRequired: false,
    isActive: true,
    sortOrder: 0,
    options: type === "SELECT" || type === "RADIO" ? { items: ["Option 1", "Option 2"] } : undefined,
    validation: {},
  };
}

function fieldPreview(field: DynamicField) {
  if (field.fieldType === "TEXTAREA") return <textarea className="h-24 w-full rounded-lg border p-2 text-sm" disabled />;
  if (field.fieldType === "BOOLEAN") return <input type="checkbox" disabled />;
  if (field.fieldType === "FILE") return <input type="file" disabled className="text-xs" />;
  if (field.fieldType === "SELECT")
    return (
      <AppSelect disabled>
        <option>Select</option>
      </AppSelect>
    );
  if (field.fieldType === "RADIO")
    return (
      <div className="flex gap-3 text-sm">
        <label><input type="radio" disabled /> Option 1</label>
        <label><input type="radio" disabled /> Option 2</label>
      </div>
    );
  const type = field.fieldType === "NUMBER" ? "number" : field.fieldType === "DATE" ? "date" : "text";
  return <Input type={type} placeholder={field.placeholder || field.label} disabled />;
}

export function DynamicFormBuilderPage() {
  const queryClient = useQueryClient();
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [dragFieldId, setDragFieldId] = useState<string | null>(null);

  const categoriesQuery = useQuery({
    queryKey: ["admin-categories-all"],
    queryFn: () => fetchAdminCategories(),
  });

  const fieldsQuery = useQuery({
    queryKey: ["category-dynamic-fields", selectedCategoryId],
    queryFn: () => fetchCategoryDynamicFields(selectedCategoryId, true),
    enabled: Boolean(selectedCategoryId),
  });

  const createMutation = useMutation({
    mutationFn: ({ type }: { type: DynamicFieldType }) =>
      createDynamicFieldApi(selectedCategoryId, defaultField(type)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["category-dynamic-fields", selectedCategoryId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ fieldId, payload }: { fieldId: string; payload: Partial<DynamicField> }) =>
      updateDynamicFieldApi(fieldId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["category-dynamic-fields", selectedCategoryId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (fieldId: string) => deleteDynamicFieldApi(fieldId),
    onSuccess: () => {
      setSelectedFieldId("");
      queryClient.invalidateQueries({ queryKey: ["category-dynamic-fields", selectedCategoryId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (fieldOrders: Array<{ fieldId: string; sortOrder: number }>) =>
      reorderDynamicFieldsApi(selectedCategoryId, fieldOrders),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["category-dynamic-fields", selectedCategoryId] }),
  });

  const fields = useMemo(
    () => [...(fieldsQuery.data || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [fieldsQuery.data]
  );
  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  const applyTemplate = async (template: "agriculturalLand" | "crop") => {
    if (!selectedCategoryId) return;
    for (const item of exampleTemplates[template]) {
      await createMutation.mutateAsync({
        type: item.fieldType,
      });
      const latest = await fetchCategoryDynamicFields(selectedCategoryId, true);
      const created = latest[latest.length - 1];
      if (!created) continue;
      await updateMutation.mutateAsync({
        fieldId: created.id,
        payload: {
          label: item.label,
          fieldKey: item.fieldKey,
          isRequired: item.isRequired,
          options:
            item.fieldType === "SELECT"
              ? { items: ["Canal", "Well", "Nile", "Rain"] }
              : item.fieldType === "RADIO"
                ? { items: ["Owned", "Leased", "Shared"] }
                : undefined,
        },
      });
    }
    queryClient.invalidateQueries({ queryKey: ["category-dynamic-fields", selectedCategoryId] });
  };

  const updateSelectedField = (patch: Partial<DynamicField>) => {
    if (!selectedField) return;
    updateMutation.mutate({ fieldId: selectedField.id, payload: patch });
  };

  return (
    <div className="space-y-4">
      <Card className="flex flex-wrap items-center gap-3">
        <div className="min-w-72 flex-1">
          <p className="mb-1 text-xs text-neutral-500">Category</p>
          <AppSelect
            value={selectedCategoryId}
            onChange={(e) => {
              setSelectedCategoryId(e.target.value);
              setSelectedFieldId("");
            }}
          >
            <option value="">Select category</option>
            {(categoriesQuery.data || []).map((category) => (
              <option key={category.id} value={category.id}>
                {category.nameAr || category.nameEn || category.id}
              </option>
            ))}
          </AppSelect>
        </div>
        <Button variant="outline" onClick={() => applyTemplate("agriculturalLand")} disabled={!selectedCategoryId}>
          Use Agricultural Land Example
        </Button>
        <Button variant="outline" onClick={() => applyTemplate("crop")} disabled={!selectedCategoryId}>
          Use Crop Example
        </Button>
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="space-y-3 lg:col-span-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Field Library</h3>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {FIELD_TYPES.map((type) => (
              <Button
                key={type}
                variant="outline"
                disabled={!selectedCategoryId}
                onClick={() => createMutation.mutate({ type })}
                className="justify-start"
              >
                <Plus className="me-1 size-4" />
                {type}
              </Button>
            ))}
          </div>
        </Card>

        <Card className="space-y-3 lg:col-span-4">
          <h3 className="font-semibold">Builder Canvas</h3>
          <div className="space-y-2">
            {fields.map((field) => (
              <div
                key={field.id}
                draggable
                onDragStart={() => setDragFieldId(field.id)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (!dragFieldId || dragFieldId === field.id) return;
                  const reordered = [...fields];
                  const fromIndex = reordered.findIndex((f) => f.id === dragFieldId);
                  const toIndex = reordered.findIndex((f) => f.id === field.id);
                  if (fromIndex < 0 || toIndex < 0) return;
                  const [moved] = reordered.splice(fromIndex, 1);
                  reordered.splice(toIndex, 0, moved);
                  reorderMutation.mutate(
                    reordered.map((item, idx) => ({ fieldId: item.id, sortOrder: idx + 1 }))
                  );
                  setDragFieldId(null);
                }}
                className={`cursor-move rounded-lg border p-3 ${selectedFieldId === field.id ? "border-[#23673A]" : ""}`}
                onClick={() => setSelectedFieldId(field.id)}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <GripVertical className="size-4 text-neutral-500" />
                    <div>
                      <p className="text-sm font-medium">{field.label}</p>
                      <p className="text-xs text-neutral-500">
                        {field.fieldType} · {field.isRequired ? "Required" : "Optional"}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteMutation.mutate(field.id);
                    }}
                  >
                    <Trash2 className="size-4 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
            {!selectedCategoryId ? (
              <p className="text-sm text-neutral-500">Choose a category to start building fields.</p>
            ) : null}
          </div>
        </Card>

        <Card className="space-y-3 lg:col-span-4">
          <h3 className="font-semibold">Field Settings & Preview</h3>
          {selectedField ? (
            <div className="space-y-3">
              <div>
                <p className="mb-1 text-xs text-neutral-500">Label</p>
                <Input
                  value={selectedField.label}
                  onChange={(e) => updateSelectedField({ label: e.target.value })}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-neutral-500">Field Key</p>
                <Input
                  value={selectedField.fieldKey}
                  onChange={(e) => updateSelectedField({ fieldKey: e.target.value })}
                />
              </div>
              <div>
                <p className="mb-1 text-xs text-neutral-500">Placeholder</p>
                <Input
                  value={selectedField.placeholder || ""}
                  onChange={(e) => updateSelectedField({ placeholder: e.target.value })}
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedField.isRequired}
                    onChange={(e) => updateSelectedField({ isRequired: e.target.checked })}
                  />
                  Required
                </label>
              </div>
              {(selectedField.fieldType === "SELECT" || selectedField.fieldType === "RADIO") && (
                <div>
                  <p className="mb-1 text-xs text-neutral-500">Options (comma separated)</p>
                  <Input
                    value={Array.isArray((selectedField.options as { items?: string[] } | undefined)?.items)
                      ? ((selectedField.options as { items: string[] }).items || []).join(", ")
                      : ""}
                    onChange={(e) =>
                      updateSelectedField({
                        options: {
                          items: e.target.value
                            .split(",")
                            .map((v) => v.trim())
                            .filter(Boolean),
                        },
                      })
                    }
                  />
                </div>
              )}
              {(selectedField.fieldType === "TEXT" ||
                selectedField.fieldType === "TEXTAREA" ||
                selectedField.fieldType === "NUMBER") && (
                <div>
                  <p className="mb-1 text-xs text-neutral-500">Validation</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      placeholder="min"
                      onChange={(e) =>
                        updateSelectedField({
                          validation: {
                            ...(typeof selectedField.validation === "object" && selectedField.validation
                              ? selectedField.validation
                              : {}),
                            min: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                    <Input
                      type="number"
                      placeholder="max"
                      onChange={(e) =>
                        updateSelectedField({
                          validation: {
                            ...(typeof selectedField.validation === "object" && selectedField.validation
                              ? selectedField.validation
                              : {}),
                            max: e.target.value ? Number(e.target.value) : undefined,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
              <div className="rounded-lg border p-3">
                <p className="mb-2 text-xs text-neutral-500">Live Preview</p>
                <label className="mb-1 block text-sm font-medium">
                  {selectedField.label} {selectedField.isRequired ? "*" : ""}
                </label>
                {fieldPreview(selectedField)}
              </div>
            </div>
          ) : (
            <p className="text-sm text-neutral-500">Select a field from builder canvas to edit settings and preview.</p>
          )}
          <Button variant="outline" className="w-full">
            <Save className="me-2 size-4" />
            Auto-Saved via API
          </Button>
        </Card>
      </div>
    </div>
  );
}
