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
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { EmptyState, PageSection } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  createDynamicFieldApi,
  deleteDynamicFieldApi,
  fetchCategoryDynamicFields,
  reorderDynamicFieldsApi,
  updateDynamicFieldApi,
  type DynamicField,
  type DynamicFieldType,
} from "../../services/admin-api";
import { dynamicFieldLabel, getDynamicFieldOptions } from "../products/product-dynamic-fields-utils";

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
    { label: "المساحة", labelEn: "Area", fieldKey: "area", fieldType: "NUMBER" as DynamicFieldType, isRequired: true },
    {
      label: "مصدر المياه",
      labelEn: "Water Source",
      fieldKey: "water_source",
      fieldType: "SELECT" as DynamicFieldType,
      isRequired: true,
    },
    {
      label: "نوع الملكية",
      labelEn: "Ownership Type",
      fieldKey: "ownership_type",
      fieldType: "RADIO" as DynamicFieldType,
      isRequired: true,
    },
  ],
  crop: [
    {
      label: "تاريخ الإنتاج",
      labelEn: "Production Date",
      fieldKey: "production_date",
      fieldType: "DATE" as DynamicFieldType,
      isRequired: true,
    },
    {
      label: "جودة التصدير",
      labelEn: "Export Quality",
      fieldKey: "export_quality",
      fieldType: "BOOLEAN" as DynamicFieldType,
      isRequired: false,
    },
  ],
};

function defaultField(type: DynamicFieldType, t: (key: string) => string): Omit<DynamicField, "id" | "categoryId"> {
  return {
    label: t("categories.fields.label"),
    labelEn: t("categories.fields.labelEn"),
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

function fieldPreview(field: DynamicField, language: "ar" | "en", t: (key: string) => string) {
  const label = dynamicFieldLabel(field, language);
  if (field.fieldType === "TEXTAREA") {
    return <TextField multiline rows={3} fullWidth size="small" disabled />;
  }
  if (field.fieldType === "BOOLEAN") {
    return <FormControlLabel control={<Switch disabled />} label={label} />;
  }
  if (field.fieldType === "FILE") {
    return (
      <Button variant="outlined" component="label" size="small" disabled>
        {t("categories.fields.chooseFile")}
        <input type="file" hidden disabled />
      </Button>
    );
  }
  if (field.fieldType === "SELECT") {
    const options = getDynamicFieldOptions(field);
    return (
      <TextField select size="small" fullWidth disabled value="">
        <MenuItem value="">{t("categories.fields.select")}</MenuItem>
        {options.map((option) => (
          <MenuItem key={option} value={option}>
            {option}
          </MenuItem>
        ))}
      </TextField>
    );
  }
  if (field.fieldType === "RADIO") {
    const options = getDynamicFieldOptions(field);
    return (
      <RadioGroup row>
        {options.map((option) => (
          <FormControlLabel key={option} value={option} control={<Radio disabled size="small" />} label={option} />
        ))}
      </RadioGroup>
    );
  }
  const type = field.fieldType === "NUMBER" ? "number" : field.fieldType === "DATE" ? "date" : "text";
  return (
    <TextField
      type={type}
      size="small"
      fullWidth
      placeholder={field.placeholder || label}
      disabled
    />
  );
}

type Props = {
  categoryId: string;
  categoryLabel?: string;
};

export function CategoryFieldsBuilder({ categoryId, categoryLabel }: Props) {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [dragFieldId, setDragFieldId] = useState<string | null>(null);

  const fieldsQuery = useQuery({
    queryKey: ["category-dynamic-fields", categoryId],
    queryFn: () => fetchCategoryDynamicFields(categoryId, true),
    enabled: Boolean(categoryId),
  });

  const createMutation = useMutation({
    mutationFn: ({ type }: { type: DynamicFieldType }) => createDynamicFieldApi(categoryId, defaultField(type, t)),
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
          labelEn: item.labelEn,
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
      <EmptyState title={t("categories.fields.emptyTitle")} description={t("categories.fields.emptyHint")} />
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
              {t("categories.fields.title")}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {categoryLabel || categoryId}
            </Typography>
          </Box>
          <Button variant="outlined" onClick={() => applyTemplate("agriculturalLand")}>
            {t("categories.fields.templateLand")}
          </Button>
          <Button variant="outlined" onClick={() => applyTemplate("crop")}>
            {t("categories.fields.templateCrop")}
          </Button>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, xl: 4 }}>
          <Paper sx={{ p: 2 }}>
            <PageSection title={t("categories.fields.typesTitle")}>
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
                      {t(`categories.fieldTypes.${type}` as "categories.fieldTypes.TEXT")}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </PageSection>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Paper sx={{ p: 2 }}>
            <PageSection title={t("categories.fields.listTitle")}>
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
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {dynamicFieldLabel(field, language)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t(`categories.fieldTypes.${field.fieldType}` as "categories.fieldTypes.TEXT")} ·{" "}
                            {field.isRequired ? t("categories.fields.required") : t("categories.fields.optional")}
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
                    {t("categories.fields.noFields")}
                  </Typography>
                ) : null}
              </Stack>
            </PageSection>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, xl: 4 }}>
          <Paper sx={{ p: 2 }}>
            <PageSection title={t("categories.fields.settingsTitle")}>
              {selectedField ? (
                <Stack spacing={2}>
                  <TextField
                    label={t("categories.fields.label")}
                    size="small"
                    fullWidth
                    value={selectedField.label}
                    onChange={(e) => updateSelectedField({ label: e.target.value })}
                  />
                  <TextField
                    label={t("categories.fields.labelEn")}
                    size="small"
                    fullWidth
                    value={selectedField.labelEn || ""}
                    onChange={(e) => updateSelectedField({ labelEn: e.target.value })}
                  />
                  <TextField
                    label={t("categories.fields.fieldKey")}
                    size="small"
                    fullWidth
                    value={selectedField.fieldKey}
                    onChange={(e) => updateSelectedField({ fieldKey: e.target.value })}
                  />
                  <TextField
                    label={t("categories.fields.placeholder")}
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
                    label={t("categories.fields.required")}
                  />
                  {(selectedField.fieldType === "SELECT" || selectedField.fieldType === "RADIO") && (
                    <TextField
                      label={t("categories.fields.options")}
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
                      {t("categories.fields.preview")}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                      {dynamicFieldLabel(selectedField, language)} {selectedField.isRequired ? "*" : ""}
                    </Typography>
                    {fieldPreview(selectedField, language, t)}
                  </Paper>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {t("categories.fields.selectHint")}
                </Typography>
              )}
              <Button variant="outlined" fullWidth disabled startIcon={<Save />} sx={{ mt: 2 }}>
                {t("categories.fields.autoSaved")}
              </Button>
            </PageSection>
          </Paper>
        </Grid>
      </Grid>
    </Stack>
  );
}
