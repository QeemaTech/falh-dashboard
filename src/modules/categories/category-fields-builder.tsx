import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add, Delete, DragIndicator, Save } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { EmptyState, PageSection } from "../../components/layout";
import {
  createDynamicFieldApi,
  deleteDynamicFieldApi,
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
  if (field.fieldType === "TEXTAREA") {
    return <TextField multiline rows={3} fullWidth size="small" disabled />;
  }
  if (field.fieldType === "BOOLEAN") {
    return <Checkbox disabled />;
  }
  if (field.fieldType === "FILE") {
    return (
      <Button variant="outlined" component="label" size="small" disabled>
        Choose file
        <input type="file" hidden disabled />
      </Button>
    );
  }
  if (field.fieldType === "SELECT") {
    return (
      <TextField select size="small" fullWidth disabled value="">
        <MenuItem value="">Select</MenuItem>
      </TextField>
    );
  }
  if (field.fieldType === "RADIO") {
    return (
      <RadioGroup row>
        <FormControlLabel value="1" control={<Radio disabled />} label="Option 1" />
        <FormControlLabel value="2" control={<Radio disabled />} label="Option 2" />
      </RadioGroup>
    );
  }
  const type = field.fieldType === "NUMBER" ? "number" : field.fieldType === "DATE" ? "date" : "text";
  return (
    <TextField
      type={type}
      size="small"
      fullWidth
      placeholder={field.placeholder || field.label}
      disabled
    />
  );
}

type Props = {
  categoryId: string;
  categoryLabel?: string;
};

export function CategoryFieldsBuilder({ categoryId, categoryLabel }: Props) {
  const queryClient = useQueryClient();
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [dragFieldId, setDragFieldId] = useState<string | null>(null);

  const fieldsQuery = useQuery({
    queryKey: ["category-dynamic-fields", categoryId],
    queryFn: () => fetchCategoryDynamicFields(categoryId, true),
    enabled: Boolean(categoryId),
  });

  const createMutation = useMutation({
    mutationFn: ({ type }: { type: DynamicFieldType }) => createDynamicFieldApi(categoryId, defaultField(type)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["category-dynamic-fields", categoryId] }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ fieldId, payload }: { fieldId: string; payload: Partial<DynamicField> }) =>
      updateDynamicFieldApi(fieldId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["category-dynamic-fields", categoryId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (fieldId: string) => deleteDynamicFieldApi(fieldId),
    onSuccess: () => {
      setSelectedFieldId("");
      queryClient.invalidateQueries({ queryKey: ["category-dynamic-fields", categoryId] });
    },
  });

  const reorderMutation = useMutation({
    mutationFn: (fieldOrders: Array<{ fieldId: string; sortOrder: number }>) =>
      reorderDynamicFieldsApi(categoryId, fieldOrders),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["category-dynamic-fields", categoryId] }),
  });

  const fields = useMemo(
    () => [...(fieldsQuery.data || [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [fieldsQuery.data]
  );
  const selectedField = fields.find((f) => f.id === selectedFieldId) || null;

  const applyTemplate = async (template: "agriculturalLand" | "crop") => {
    if (!categoryId) return;
    for (const item of exampleTemplates[template]) {
      await createMutation.mutateAsync({ type: item.fieldType });
      const latest = await fetchCategoryDynamicFields(categoryId, true);
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
    queryClient.invalidateQueries({ queryKey: ["category-dynamic-fields", categoryId] });
  };

  const updateSelectedField = (patch: Partial<DynamicField>) => {
    if (!selectedField) return;
    updateMutation.mutate({ fieldId: selectedField.id, payload: patch });
  };

  if (!categoryId) {
    return (
      <EmptyState
        title="No category selected"
        description="Select a category from the table above to manage its dynamic fields."
      />
    );
  }

  return (
    <Stack spacing={3} sx={{ minWidth: 0 }}>
      <Paper sx={{ p: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { sm: "center" }, flexWrap: "wrap" }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Dynamic fields
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {categoryLabel || categoryId}
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => applyTemplate("agriculturalLand")}>
            Agricultural Land Example
          </Button>
          <Button variant="outlined" onClick={() => applyTemplate("crop")}>
            Crop Example
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Paper sx={{ p: 2 }}>
            <PageSection title="Field types">
              <Grid container spacing={1}>
                {FIELD_TYPES.map((type) => (
                  <Grid key={type} size={{ xs: 12, sm: 6 }}>
                    <Button
                      variant="outlined"
                      fullWidth
                      startIcon={<Add />}
                      onClick={() => createMutation.mutate({ type })}
                      sx={{ justifyContent: "flex-start" }}
                    >
                      {type}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </PageSection>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Paper sx={{ p: 2 }}>
            <PageSection title="Fields list">
              <Stack spacing={1} sx={{ maxHeight: 420, overflowY: "auto" }}>
                {fields.map((field) => (
                  <Paper
                    key={field.id}
                    variant="outlined"
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
                      reorderMutation.mutate(reordered.map((item, idx) => ({ fieldId: item.id, sortOrder: idx + 1 })));
                      setDragFieldId(null);
                    }}
                    onClick={() => setSelectedFieldId(field.id)}
                    sx={{
                      p: 1.5,
                      cursor: "move",
                      borderColor: selectedFieldId === field.id ? "primary.main" : "divider",
                      borderWidth: selectedFieldId === field.id ? 2 : 1,
                    }}
                  >
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                      <Stack direction="row" spacing={1} sx={{ alignItems: "center", minWidth: 0 }}>
                        <DragIndicator fontSize="small" color="action" />
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {field.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {field.fieldType} · {field.isRequired ? "Required" : "Optional"}
                          </Typography>
                        </Box>
                      </Stack>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMutation.mutate(field.id);
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Stack>
                  </Paper>
                ))}
                {!fields.length ? (
                  <Typography variant="body2" color="text.secondary">
                    No fields yet. Add a field type to start.
                  </Typography>
                ) : null}
              </Stack>
            </PageSection>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Paper sx={{ p: 2 }}>
            <PageSection title="Field settings">
              {selectedField ? (
                <Stack spacing={2}>
                  <TextField
                    label="Label"
                    size="small"
                    fullWidth
                    value={selectedField.label}
                    onChange={(e) => updateSelectedField({ label: e.target.value })}
                  />
                  <TextField
                    label="Field key"
                    size="small"
                    fullWidth
                    value={selectedField.fieldKey}
                    onChange={(e) => updateSelectedField({ fieldKey: e.target.value })}
                  />
                  <TextField
                    label="Placeholder"
                    size="small"
                    fullWidth
                    value={selectedField.placeholder || ""}
                    onChange={(e) => updateSelectedField({ placeholder: e.target.value })}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedField.isRequired}
                        onChange={(e) => updateSelectedField({ isRequired: e.target.checked })}
                      />
                    }
                    label="Required"
                  />
                  {(selectedField.fieldType === "SELECT" || selectedField.fieldType === "RADIO") && (
                    <TextField
                      label="Options (comma separated)"
                      size="small"
                      fullWidth
                      value={
                        Array.isArray((selectedField.options as { items?: string[] } | undefined)?.items)
                          ? ((selectedField.options as { items: string[] }).items || []).join(", ")
                          : ""
                      }
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
                  )}
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                      Preview
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      {selectedField.label} {selectedField.isRequired ? "*" : ""}
                    </Typography>
                    {fieldPreview(selectedField)}
                  </Paper>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Select a field to edit.
                </Typography>
              )}
              <Button variant="outlined" fullWidth disabled startIcon={<Save />} sx={{ mt: 2 }}>
                Auto-saved
              </Button>
            </PageSection>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
