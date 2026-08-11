import type { DynamicField, DynamicFieldInputMode } from "../../services/admin-api";

export type DynamicFieldEntry = {
  value: string;
  fileUrl?: string;
};

export type DynamicFieldOptionItem = {
  value: string;
  label: string;
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

export function resolveFieldInputMode(field: DynamicField): DynamicFieldInputMode {
  if (field.inputMode === "OPTIONS" || field.inputMode === "VALUE") return field.inputMode;
  if (field.fieldType === "SELECT" || field.fieldType === "RADIO") return "OPTIONS";
  return "VALUE";
}

export function isOptionsInputMode(field: DynamicField) {
  return resolveFieldInputMode(field) === "OPTIONS";
}

export function getDynamicFieldOptionItems(field: DynamicField): DynamicFieldOptionItem[] {
  const options = field.options as
    | Array<string | { value?: string; label?: string }>
    | { items?: Array<string | { value?: string; label?: string }> }
    | null
    | undefined;

  const list = Array.isArray(options)
    ? options
    : options && Array.isArray(options.items)
      ? options.items
      : [];

  return list
    .map((item) => {
      if (typeof item === "string" || typeof item === "number" || typeof item === "boolean") {
        const value = String(item).trim();
        return value ? { value, label: value } : null;
      }
      if (!item || typeof item !== "object") return null;
      const value = String(item.value ?? item.label ?? "").trim();
      if (!value) return null;
      const label = String(item.label ?? value).trim() || value;
      return { value, label };
    })
    .filter((item): item is DynamicFieldOptionItem => Boolean(item));
}

/** @deprecated prefer getDynamicFieldOptionItems — kept for callers that only need values */
export function getDynamicFieldOptions(field: DynamicField): string[] {
  return getDynamicFieldOptionItems(field).map((item) => item.value);
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
