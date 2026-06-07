import type { DynamicField } from "../../services/admin-api";

export type DynamicFieldEntry = {
  value: string;
  fileUrl?: string;
};

export type DynamicFieldValuesMap = Record<string, DynamicFieldEntry>;

export function dynamicFieldLabel(field: DynamicField, language: "ar" | "en") {
  if (language === "ar") return field.label || field.labelEn || field.fieldKey;
  return field.labelEn || field.label || field.fieldKey;
}

export function dynamicFieldPlaceholder(field: DynamicField, language: "ar" | "en") {
  if (field.placeholder) return field.placeholder;
  return dynamicFieldLabel(field, language);
}

export function getDynamicFieldOptions(field: DynamicField): string[] {
  const options = field.options as { items?: string[] } | string[] | null | undefined;
  if (Array.isArray(options)) {
    return options.map((item) => String(typeof item === "object" && item ? (item as { value?: string }).value ?? item : item));
  }
  if (options && Array.isArray(options.items)) {
    return options.items.map((item) => String(item));
  }
  return [];
}

export function buildDynamicFieldsPayload(fields: DynamicField[], values: DynamicFieldValuesMap) {
  return fields.map((field) => {
    const entry = values[field.id] || { value: "" };
    return {
      fieldId: field.id,
      value: entry.value ?? "",
      ...(entry.fileUrl ? { fileUrl: entry.fileUrl } : {}),
    };
  });
}

export function validateDynamicFieldValues(
  fields: DynamicField[],
  values: DynamicFieldValuesMap,
  language: "ar" | "en",
  requiredMessage: (label: string) => string
) {
  for (const field of fields) {
    if (!field.isRequired) continue;
    const entry = values[field.id];
    const label = dynamicFieldLabel(field, language);
    if (field.fieldType === "FILE") {
      if (!entry?.fileUrl) throw new Error(requiredMessage(label));
      continue;
    }
    if (field.fieldType === "BOOLEAN") {
      if (!entry?.value) throw new Error(requiredMessage(label));
      continue;
    }
    if (!entry?.value?.trim()) throw new Error(requiredMessage(label));
  }
}

export function fieldValuesToMap(
  fieldValues?: Array<{ fieldId?: string; value?: string | null; fileUrl?: string | null; field?: { id: string } }>
): DynamicFieldValuesMap {
  const map: DynamicFieldValuesMap = {};
  for (const item of fieldValues || []) {
    const fieldId = item.fieldId || item.field?.id;
    if (!fieldId) continue;
    map[fieldId] = {
      value: item.value ?? "",
      fileUrl: item.fileUrl || undefined,
    };
  }
  return map;
}

export function sortedDynamicFields(fields: DynamicField[]) {
  return [...fields]
    .filter((field) => field.isActive !== false)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
