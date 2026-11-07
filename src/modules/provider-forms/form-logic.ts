/**
 * Pure helpers for the provider form builder, previews, filters and answer display.
 * No React / DOM imports so they can be unit-tested with the plain Node test runner.
 * The backend remains the source of truth for every rule; these mirror it for UX only.
 */
import type {
  FilterType,
  FormFieldType,
  FormQuestion,
  MappingTarget,
} from "../../services/provider-forms-api";

export const FIELD_TYPES: FormFieldType[] = [
  "TEXT",
  "TEXTAREA",
  "NUMBER",
  "SELECT",
  "MULTI_SELECT",
  "RADIO",
  "CHECKBOX",
  "DATE",
  "FILE",
];

export const OPTION_FIELD_TYPES: FormFieldType[] = ["SELECT", "MULTI_SELECT", "RADIO"];

/** Which field types may feed which structured provider column (mirrors the backend matrix). */
export const MAPPING_TARGETS: Record<MappingTarget, FormFieldType[]> = {
  bio: ["TEXT", "TEXTAREA"],
  education: ["TEXT", "TEXTAREA"],
  yearsOfExperience: ["NUMBER"],
  specializations: ["MULTI_SELECT"],
  idImagePath: ["FILE"],
  licensePath: ["FILE"],
};

const KEY_REGEX = /^[a-z][a-zA-Z0-9_]{1,63}$/;
const OPTION_VALUE_REGEX = /^[A-Za-z0-9_-]{1,64}$/;
export const RESERVED_KEYS = [
  "fullName", "name", "phone", "contactNumber", "whatsappNumber", "isWhatsappSameAsPhone", "city", "email",
  "applicationType", "type", "companyName", "profileImage", "answers", "formVersionId",
];

export function emptyQuestion(sortOrder = 0): FormQuestion {
  return {
    key: "",
    labelAr: "",
    labelEn: "",
    fieldType: "TEXT",
    required: false,
    sortOrder,
    options: [],
    validation: {},
    visibleWhen: null,
    mapsTo: null,
    isPublic: false,
  };
}

/** Suggests a machine key from an English label: "Years of experience" -> "yearsOfExperience". */
export function suggestKey(labelEn: string): string {
  const words = labelEn
    .replace(/[^A-Za-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!words.length) return "";
  const key = words
    .map((w, i) => (i === 0 ? w.charAt(0).toLowerCase() + w.slice(1) : w.charAt(0).toUpperCase() + w.slice(1)))
    .join("");
  return /^[a-z]/.test(key) ? key.slice(0, 64) : `q${key}`.slice(0, 64);
}

export type QuestionErrors = Record<string, string>;

/** Client-side check for fast feedback. The server repeats (and is authoritative for) all of it. */
export function validateQuestionDraft(q: FormQuestion, existingKeys: string[] = [], isNew = true): QuestionErrors {
  const e: QuestionErrors = {};
  if (!KEY_REGEX.test(q.key)) e.key = "invalidKey";
  else if (RESERVED_KEYS.includes(q.key)) e.key = "reservedKey";
  else if (isNew && existingKeys.includes(q.key)) e.key = "duplicateKey";
  if (q.labelAr.trim().length < 2) e.labelAr = "required";
  if (q.labelEn.trim().length < 2) e.labelEn = "required";

  if (OPTION_FIELD_TYPES.includes(q.fieldType)) {
    if (q.options.length === 0) e.options = "optionsRequired";
    else {
      const seen = new Set<string>();
      for (const o of q.options) {
        if (!OPTION_VALUE_REGEX.test(o.value) || !o.labelAr.trim() || !o.labelEn.trim()) {
          e.options = "optionInvalid";
          break;
        }
        if (seen.has(o.value)) {
          e.options = "optionDuplicate";
          break;
        }
        seen.add(o.value);
      }
    }
  }

  const v = q.validation;
  if (v.minLength !== undefined && v.maxLength !== undefined && v.minLength > v.maxLength) e.validation = "rangeInvalid";
  if (v.min !== undefined && v.max !== undefined && v.min > v.max) e.validation = "rangeInvalid";
  if (v.minSelections !== undefined && v.maxSelections !== undefined && v.minSelections > v.maxSelections) {
    e.validation = "rangeInvalid";
  }
  if (q.fieldType === "FILE" && (v.maxFiles ?? 1) > 10) e.validation = "maxFiles";

  if (q.mapsTo) {
    if (!MAPPING_TARGETS[q.mapsTo]?.includes(q.fieldType)) e.mapsTo = "mappingType";
    else if (q.mapsTo === "yearsOfExperience" && !(v.integerOnly === true && (v.min ?? -1) >= 0)) e.mapsTo = "mappingYears";
    else if ((q.mapsTo === "idImagePath" || q.mapsTo === "licensePath") && (v.maxFiles ?? 1) !== 1) e.mapsTo = "mappingSingleFile";
  }
  if (q.isPublic && q.fieldType === "FILE") e.isPublic = "filePublic";
  return e;
}

/** Field types a column mapping may be offered for, given the current field type. */
export function mappingChoices(fieldType: FormFieldType, usedByOthers: MappingTarget[] = []): MappingTarget[] {
  return (Object.keys(MAPPING_TARGETS) as MappingTarget[]).filter(
    (target) => MAPPING_TARGETS[target].includes(fieldType) && !usedByOthers.includes(target)
  );
}

/** New order of ids after moving one id up (-1) or down (+1). Returns the same order at the edges. */
export function moveId(ids: string[], id: string, direction: -1 | 1): string[] {
  const index = ids.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= ids.length) return ids;
  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

export function sortQuestions<T extends { sortOrder: number }>(questions: T[]): T[] {
  return [...questions].sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Conditional visibility used by the preview (same semantics as the backend). */
export function isQuestionVisible(q: FormQuestion, answers: Record<string, unknown>): boolean {
  const w = q.visibleWhen;
  if (!w) return true;
  const actual = answers[w.questionKey];
  if (w.operator === "in") return Array.isArray(w.value) && w.value.map(String).includes(String(actual));
  if (typeof actual === "boolean") return actual === (String(w.value) === "true");
  return String(actual) === String(w.value);
}

export function visibleQuestions(questions: FormQuestion[], answers: Record<string, unknown>): FormQuestion[] {
  return sortQuestions(questions).filter((q) => isQuestionVisible(q, answers));
}

export type FilterOption = { code: string; label: string; archived: boolean; inactive: boolean };

/**
 * Builds the options of every provider-type filter from the backend list.
 * COMPANY is never offered; archived / inactive types stay selectable so historical data can be reviewed.
 */
export function buildTypeFilterOptions(types: FilterType[], language: "ar" | "en"): FilterOption[] {
  return types
    .filter((t) => t.code !== "COMPANY")
    .map((t) => ({
      code: t.code,
      label: (language === "ar" ? t.nameAr || t.nameEn : t.nameEn || t.nameAr) || t.code,
      archived: t.archived,
      inactive: !t.isActive,
    }));
}

export function filterOptionLabel(option: FilterOption, suffixes: { archived: string; inactive: string }): string {
  if (option.archived) return `${option.label} (${suffixes.archived})`;
  if (option.inactive) return `${option.label} (${suffixes.inactive})`;
  return option.label;
}

export type FormattedAnswer = { kind: "text"; text: string } | { kind: "files"; paths: string[] };

/** Renders a stored answer using the labels of the form version it was submitted with. */
export function formatAnswerValue(q: FormQuestion, value: unknown, language: "ar" | "en"): FormattedAnswer {
  const label = (code: unknown) => {
    const option = q.options.find((o) => o.value === String(code));
    if (!option) return String(code);
    return (language === "ar" ? option.labelAr || option.labelEn : option.labelEn || option.labelAr) || String(code);
  };
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return { kind: "text", text: "-" };
  }
  switch (q.fieldType) {
    case "FILE":
      return { kind: "files", paths: (Array.isArray(value) ? value : [value]).map(String) };
    case "CHECKBOX":
      return { kind: "text", text: value === true ? (language === "ar" ? "نعم" : "Yes") : language === "ar" ? "لا" : "No" };
    case "SELECT":
    case "RADIO":
      return { kind: "text", text: label(value) };
    case "MULTI_SELECT":
      return { kind: "text", text: (Array.isArray(value) ? value : [value]).map(label).join(language === "ar" ? "، " : ", ") };
    default:
      return { kind: "text", text: String(value) };
  }
}

/** Answers whose question no longer exists in the version (should not happen, shown rather than lost). */
export function orphanAnswerKeys(questions: FormQuestion[], answers: Record<string, unknown>): string[] {
  const known = new Set(questions.map((q) => q.key));
  return Object.keys(answers).filter((k) => !known.has(k));
}
