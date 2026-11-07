import { http } from "./http";

type ApiResponse<T> = { success: boolean; data: T; message?: string; meta?: Record<string, unknown> };

export type FormFieldType =
  | "TEXT"
  | "TEXTAREA"
  | "NUMBER"
  | "SELECT"
  | "MULTI_SELECT"
  | "RADIO"
  | "CHECKBOX"
  | "DATE"
  | "FILE";

export type MappingTarget = "bio" | "education" | "yearsOfExperience" | "specializations" | "idImagePath" | "licensePath";

export type QuestionOption = { value: string; labelAr: string; labelEn: string };

export type QuestionValidation = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  integerOnly?: boolean;
  minSelections?: number;
  maxSelections?: number;
  maxFiles?: number;
};

export type QuestionVisibility = { questionKey: string; operator: "equals" | "in"; value: unknown };

export type FormQuestion = {
  id?: string;
  key: string;
  labelAr: string;
  labelEn: string;
  helpAr?: string | null;
  helpEn?: string | null;
  placeholderAr?: string | null;
  placeholderEn?: string | null;
  fieldType: FormFieldType;
  required: boolean;
  sortOrder: number;
  options: QuestionOption[];
  validation: QuestionValidation;
  visibleWhen: QuestionVisibility | null;
  mapsTo: MappingTarget | null;
  isPublic: boolean;
};

export type ProviderType = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  category: "COMPANY" | "PROVIDER";
  isSystem: boolean;
  isActive: boolean;
  archivedAt?: string | null;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  /** false for COMPANY: it is fixed and cannot be changed here. */
  managed: boolean;
  sortOrder: number;
  hasPublishedForm?: boolean;
  publishedVersion?: number | null;
  applicationsCount?: number;
  formVersionsCount?: number;
};

export type FormVersionSummary = {
  id: string;
  typeId: string;
  version: number;
  status: "DRAFT" | "PUBLISHED" | "SUPERSEDED";
  note?: string | null;
  publishedAt?: string | null;
  createdAt: string;
  questionsCount: number;
  applicationsCount: number;
};

export type FormVersionDetail = {
  type: { id: string; code: string; nameAr: string; nameEn: string };
  form: {
    id: string;
    typeId: string;
    version: number;
    status: "DRAFT" | "PUBLISHED" | "SUPERSEDED";
    publishedAt?: string | null;
    questions: FormQuestion[];
  };
};

export type FormProblem = { field: string; message: string };

export type FormPreview = FormVersionDetail & {
  publishable: boolean;
  problems: FormProblem[];
  sample: null | { valid: true; answers: Record<string, unknown> } | { valid: false; errors: FormProblem[] };
};

export type CutoverReadiness = {
  mode: "LEGACY" | "DYNAMIC";
  ready: boolean;
  activeProviderTypes: number;
  blockers: { id: string; code: string; nameAr: string; nameEn: string }[];
  items: { id: string; code: string; nameAr: string; nameEn: string; hasPublishedForm: boolean }[];
};

export type FilterType = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  isActive: boolean;
  archived: boolean;
  providersCount?: number;
  applicationsCount?: number;
};

/** Error carrying the per-field details the backend returns on validation failures. */
export class ApiValidationError extends Error {
  fields: FormProblem[];
  constructor(message: string, fields: FormProblem[]) {
    super(message);
    this.fields = fields;
  }
}

function rethrow(error: unknown): never {
  const response = (error as { response?: { data?: { message?: string; errors?: FormProblem[]; blockers?: unknown } } })?.response;
  const data = response?.data;
  if (data?.errors?.length) throw new ApiValidationError(data.message || "Validation failed", data.errors);
  if (data?.message) throw new Error(data.message);
  throw error;
}

async function call<T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    return (await promise).data.data;
  } catch (error) {
    rethrow(error);
  }
}

// ---- provider types ----
export const fetchProviderTypes = () => call<ProviderType[]>(http.get("/admin/join-us/types"));
export const createProviderType = (payload: {
  nameAr: string;
  nameEn: string;
  code?: string;
  descriptionAr?: string;
  descriptionEn?: string;
}) => call<ProviderType>(http.post("/admin/join-us/types", payload));
export const updateProviderType = (
  id: string,
  payload: Partial<{ nameAr: string; nameEn: string; descriptionAr: string; descriptionEn: string; sortOrder: number }>
) => call<ProviderType>(http.patch(`/admin/join-us/types/${id}`, payload));
export const activateProviderType = (id: string) => call<ProviderType>(http.post(`/admin/join-us/types/${id}/activate`));
export const deactivateProviderType = (id: string) => call<ProviderType>(http.post(`/admin/join-us/types/${id}/deactivate`));
export const archiveProviderType = (id: string) => call<ProviderType>(http.post(`/admin/join-us/types/${id}/archive`));
export const unarchiveProviderType = (id: string) => call<ProviderType>(http.post(`/admin/join-us/types/${id}/unarchive`));

// ---- forms ----
export const fetchFormVersions = (typeId: string) => call<FormVersionSummary[]>(http.get(`/admin/join-us/types/${typeId}/forms`));
export const fetchFormVersion = (versionId: string) => call<FormVersionDetail>(http.get(`/admin/join-us/forms/${versionId}`));
export const createDraftForm = (typeId: string, payload: { cloneFromVersionId?: string; note?: string } = {}) =>
  call<{ id: string; version: number }>(http.post(`/admin/join-us/types/${typeId}/forms/draft`, payload));
export const discardDraftForm = (versionId: string) => call<{ id: string }>(http.delete(`/admin/join-us/forms/${versionId}`));
export const addQuestionApi = (versionId: string, q: Partial<FormQuestion>) =>
  call<FormQuestion>(http.post(`/admin/join-us/forms/${versionId}/questions`, q));
export const updateQuestionApi = (versionId: string, questionId: string, q: Partial<FormQuestion>) =>
  call<FormQuestion>(http.patch(`/admin/join-us/forms/${versionId}/questions/${questionId}`, q));
export const deleteQuestionApi = (versionId: string, questionId: string) =>
  call<{ id: string }>(http.delete(`/admin/join-us/forms/${versionId}/questions/${questionId}`));
export const reorderQuestionsApi = (versionId: string, orderedIds: string[]) =>
  call<FormQuestion[]>(http.put(`/admin/join-us/forms/${versionId}/questions/order`, { orderedIds }));
export const previewFormApi = (versionId: string, sampleAnswers?: Record<string, unknown>) =>
  call<FormPreview>(http.post(`/admin/join-us/forms/${versionId}/preview`, { sampleAnswers }));
export const publishFormApi = (versionId: string) => call<{ id: string; version: number }>(http.post(`/admin/join-us/forms/${versionId}/publish`));

// ---- safe rollout ----
export const fetchCutoverReadiness = () => call<CutoverReadiness>(http.get("/admin/join-us/cutover"));
export const completeCutoverApi = () => call<CutoverReadiness>(http.post("/admin/join-us/cutover/complete"));
export const revertCutoverApi = () => call<CutoverReadiness>(http.post("/admin/join-us/cutover/revert"));

// ---- unified filter sources (always from the backend, never hardcoded) ----
export const fetchProviderFilterTypes = () => call<FilterType[]>(http.get("/service-providers/filter-types"));
export const fetchApplicationFilterTypes = () => call<FilterType[]>(http.get("/admin/join-us/filter-types"));
