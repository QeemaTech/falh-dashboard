import { http } from "./http";
import type { DashboardStats, User } from "../types/dashboard";

type ApiResponse<T> = { success: boolean; data: T; meta?: { total?: number; page?: number; limit?: number } };

export async function fetchDashboardStats() {
  const { data } = await http.get<ApiResponse<DashboardStats>>("/admin/dashboard/stats");
  return data.data;
}

export async function fetchUsers(params: {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { data } = await http.get<ApiResponse<User[]>>("/admin/users", { params });
  return { users: data.data, meta: data.meta };
}

export type AdminOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  user?: { name?: string };
};

export type AdminBanner = {
  id: string;
  title: string;
  imagePath: string;
  linkType?: string;
  linkValue?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
};

export type AdminProduct = {
  id: string;
  title: string;
  description?: string;
  status: string;
  price?: number;
  quantity?: number;
  unit?: string;
  target?: string;
  city?: string;
  createdAt: string;
  category?: { id: string; nameAr?: string; nameEn?: string };
  user?: { id: string; name?: string };
  company?: { id: string; name?: string };
  images?: Array<{ id: string; path: string }>;
};

export async function fetchRecentOrders() {
  const { data } = await http.get<ApiResponse<AdminOrder[]>>("/admin/orders", {
    params: { page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" },
  });
  return data.data;
}

export async function fetchAdminOrders(params: {
  page: number;
  limit: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { data } = await http.get<ApiResponse<AdminOrder[]>>("/admin/orders", { params });
  return {
    items: data.data,
    meta: data.meta as { page?: number; limit?: number; total?: number; totalPages?: number },
  };
}

export async function fetchRecentProducts() {
  const { data } = await http.get<ApiResponse<AdminProduct[]>>("/admin/products", {
    params: { page: 1, limit: 5, sortBy: "createdAt", sortOrder: "desc" },
  });
  return data.data;
}

export async function fetchAdminProducts(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { data } = await http.get<ApiResponse<AdminProduct[]>>("/admin/products", { params });
  return {
    items: data.data,
    meta: data.meta as { page?: number; limit?: number; total?: number; totalPages?: number },
  };
}

export async function reviewProductApi(
  productId: string,
  payload: { action: "APPROVE" | "REJECT"; adminNote?: string }
) {
  const { data } = await http.patch<ApiResponse<AdminProduct>>(`/admin/products/${productId}/review`, payload);
  return data.data;
}

export async function deleteProductApi(productId: string) {
  await http.delete(`/admin/products/${productId}`);
}

export type ProductFormPayload = {
  title: string;
  description: string;
  categoryId: string;
  quantity: number;
  unit: string;
  price: number;
  city?: string;
  target?: "LOCAL" | "EXPORT";
  images?: string[];
  companyId?: string;
  publishActive?: boolean;
  dynamicFields?: Array<{ fieldId: string; value: string; fileUrl?: string }>;
};

export async function createAdminProductApi(payload: ProductFormPayload) {
  const { data } = await http.post<ApiResponse<AdminProduct>>("/admin/products", payload);
  return data.data;
}

export async function updateAdminProductApi(productId: string, payload: Partial<ProductFormPayload> & { submitForReview?: boolean }) {
  const { data } = await http.patch<ApiResponse<AdminProduct>>(`/admin/products/${productId}`, payload);
  return data.data;
}

export async function bulkReviewProductsApi(payload: {
  productIds: string[];
  action: "APPROVE" | "REJECT";
  adminNote?: string;
}) {
  const { data } = await http.patch<ApiResponse<{ results: AdminProduct[]; errors: Array<{ productId: string; message: string }> }>>(
    "/admin/products/bulk-review",
    payload
  );
  return data.data;
}

export type CompanyApplication = {
  id: string;
  companyName: string;
  applicantName: string;
  phone: string;
  email?: string;
  city: string;
  description?: string;
  status: string;
  createdAt: string;
  adminNote?: string;
};

export async function fetchCompanyApplications(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}) {
  const { data } = await http.get<ApiResponse<CompanyApplication[]>>("/admin/companies/applications", { params });
  return {
    items: data.data,
    meta: data.meta as { page?: number; limit?: number; total?: number; totalPages?: number },
  };
}

export async function fetchServiceProvidersCount() {
  const { data } = await http.get<ApiResponse<unknown[]>>("/admin/service-providers", {
    params: { page: 1, limit: 1, sortBy: "createdAt", sortOrder: "desc" },
  });
  return Number(data.meta?.total || 0);
}

export type AdminServiceProvider = {
  id: string;
  type: string;
  status: string;
  city: string;
  rating?: number;
  user?: { id: string; name?: string; email?: string; phone?: string };
};

export async function fetchAdminServiceProviders(params: {
  page: number;
  limit: number;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { data } = await http.get<ApiResponse<AdminServiceProvider[]>>("/admin/service-providers", { params });
  return {
    items: data.data,
    meta: data.meta as { page?: number; limit?: number; total?: number; totalPages?: number },
  };
}

export type AdminCompany = {
  id: string;
  name: string;
  city: string;
  phone: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
  rating: number;
  productsCount: number;
  revenue: number;
  maxProducts: number;
  createdAt: string;
  user?: { id: string; name?: string; email?: string };
};

export async function fetchAdminCompanies(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { data } = await http.get<ApiResponse<AdminCompany[]>>("/admin/companies", { params });
  return {
    items: data.data,
    meta: data.meta as { page?: number; limit?: number; total?: number; totalPages?: number },
  };
}

export async function reviewCompanyApplicationApi(
  applicationId: string,
  payload: {
    action: "APPROVE" | "REJECT";
    maxProducts?: number;
    email?: string;
    password?: string;
    adminNote?: string;
  }
) {
  const { data } = await http.patch(`/admin/companies/applications/${applicationId}/review`, payload);
  return data;
}

export async function setCompanyStatusApi(
  companyId: string,
  action: "approve" | "reject" | "suspend",
  adminNote?: string
) {
  const { data } = await http.patch(`/admin/companies/${companyId}/${action}`, { adminNote });
  return data;
}

export async function assignCompanyProductLimitApi(companyId: string, maxProducts: number) {
  const { data } = await http.patch(`/admin/companies/${companyId}/product-limit`, { maxProducts });
  return data;
}

export async function resetCompanyPasswordApi(companyId: string, newPassword?: string) {
  const { data } = await http.post(`/admin/companies/${companyId}/reset-password`, { newPassword });
  return data;
}

export type AdminCategory = {
  id: string;
  nameAr?: string;
  nameEn?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type DynamicFieldType =
  | "TEXT"
  | "NUMBER"
  | "DATE"
  | "SELECT"
  | "RADIO"
  | "FILE"
  | "BOOLEAN"
  | "TEXTAREA";

export type DynamicField = {
  id: string;
  categoryId: string;
  label: string;
  labelEn?: string;
  fieldKey: string;
  fieldType: DynamicFieldType;
  placeholder?: string;
  helpText?: string;
  isRequired: boolean;
  isActive: boolean;
  sortOrder: number;
  options?: unknown;
  validation?: unknown;
};

export async function fetchAdminCategories(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { data } = await http.get<ApiResponse<AdminCategory[]>>("/admin/categories", {
    params: { page: 1, limit: 100, sortBy: "nameAr", sortOrder: "asc", ...(params || {}) },
  });
  return data.data;
}

export async function createAdminCategoryApi(payload: {
  nameAr: string;
  nameEn?: string;
  image?: string;
  sortOrder?: number;
  isActive?: boolean;
}) {
  const { data } = await http.post<ApiResponse<AdminCategory>>("/admin/categories", payload);
  return data.data;
}

export async function updateAdminCategoryApi(
  categoryId: string,
  payload: Partial<{ nameAr: string; nameEn: string; image: string; sortOrder: number; isActive: boolean }>
) {
  const { data } = await http.patch<ApiResponse<AdminCategory>>(`/admin/categories/${categoryId}`, payload);
  return data.data;
}

export async function deleteAdminCategoryApi(categoryId: string) {
  await http.delete(`/admin/categories/${categoryId}`);
}

export type AdminCropPrice = {
  id: string;
  cropName: string;
  cropNameEn?: string;
  pricePerKg: number;
  unit: string;
  currency: string;
  trend: string;
  source: string;
  recordedAt: string;
};

export async function fetchAdminCropPrices(params?: {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { data } = await http.get<ApiResponse<AdminCropPrice[]>>("/admin/crop-prices", {
    params: { page: 1, limit: 100, sortBy: "recordedAt", sortOrder: "desc", ...(params || {}) },
  });
  return {
    items: data.data,
    meta: data.meta as { page?: number; limit?: number; total?: number; totalPages?: number },
  };
}

export type WeatherThresholds = {
  windSpeedMax?: number;
  tempMin?: number;
  tempMax?: number;
};

export type WeatherSettings = {
  defaultCity: string;
  thresholds?: WeatherThresholds;
  updatedAt?: string;
};

export type WeatherSettingsPayload = {
  defaultCity?: string;
  thresholds?: WeatherThresholds;
};

export async function fetchWeatherSettingsApi() {
  const { data } = await http.get<ApiResponse<WeatherSettings>>("/admin/weather/settings");
  return data.data;
}

export async function updateWeatherSettingsApi(payload: WeatherSettingsPayload) {
  const { data } = await http.patch<ApiResponse<WeatherSettings>>("/admin/weather/settings", payload);
  return data.data;
}

export async function fetchAdminBanners() {
  const { data } = await http.get<ApiResponse<AdminBanner[]>>("/admin/banners");
  return data.data;
}

export type BannerFormPayload = {
  title: string;
  image: File;
  linkType?: string;
  linkValue?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export async function createAdminBannerApi(payload: BannerFormPayload) {
  const formData = new FormData();
  formData.append("title", payload.title);
  formData.append("image", payload.image);
  if (payload.linkType) formData.append("linkType", payload.linkType);
  if (payload.linkValue) formData.append("linkValue", payload.linkValue);
  formData.append("sortOrder", String(payload.sortOrder ?? 0));
  formData.append("isActive", String(payload.isActive ?? true));

  const { data } = await http.post<ApiResponse<AdminBanner>>("/admin/banners", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export async function deleteAdminBannerApi(bannerId: string) {
  await http.delete(`/admin/banners/${bannerId}`);
}

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

export async function fetchUserNotifications(userId: string, params?: { page?: number; limit?: number }) {
  const { data } = await http.get<ApiResponse<AdminNotification[]>>(`/admin/notifications/users/${userId}`, {
    params: { page: 1, limit: 50, ...(params || {}) },
  });
  return {
    items: data.data,
    meta: data.meta as { page?: number; limit?: number; total?: number; totalPages?: number },
  };
}

export async function fetchCategoryDynamicFields(categoryId: string, includeInactive = true) {
  const { data } = await http.get<ApiResponse<DynamicField[]>>(`/admin/categories/${categoryId}/dynamic-fields`, {
    params: { includeInactive },
  });
  return data.data;
}

export async function createDynamicFieldApi(
  categoryId: string,
  payload: Omit<DynamicField, "id" | "categoryId">
) {
  const { data } = await http.post<ApiResponse<DynamicField>>(`/admin/categories/${categoryId}/dynamic-fields`, payload);
  return data.data;
}

export async function updateDynamicFieldApi(fieldId: string, payload: Partial<DynamicField>) {
  const { data } = await http.patch<ApiResponse<DynamicField>>(`/admin/dynamic-fields/${fieldId}`, payload);
  return data.data;
}

export async function deleteDynamicFieldApi(fieldId: string) {
  await http.delete(`/admin/dynamic-fields/${fieldId}`);
}

export async function reorderDynamicFieldsApi(
  categoryId: string,
  fieldOrders: Array<{ fieldId: string; sortOrder: number }>
) {
  await http.patch(`/admin/categories/${categoryId}/dynamic-fields/reorder`, { fieldOrders });
}

export type SystemSettings = {
  general: {
    projectName: string;
    logo: string;
    favicon: string;
    footerText: string;
  };
  contact: {
    phone: string;
    email: string;
    whatsapp: string;
    address: string;
  };
  social: {
    facebook: string;
    instagram: string;
    x: string;
    tiktok: string;
    youtube: string;
  };
  application: {
    currency: string;
    language: string;
    timezone: string;
    splashScreen: string;
    appIcon: string;
    loginBackground: string;
  };
  appearance?: {
    logo: string;
    loginLogo: string;
    loginBackground: string;
    dashboardTheme: string;
    colorMode: "dark" | "light" | "system";
    darkModeEnabled: boolean;
    lightModeEnabled: boolean;
  };
};

export async function fetchSystemSettings() {
  const { data } = await http.get<ApiResponse<SystemSettings>>("/admin/system-settings");
  return data.data;
}

export async function updateSystemSettingsApi(payload: Partial<SystemSettings>) {
  const { data } = await http.patch<ApiResponse<SystemSettings>>("/admin/system-settings", payload);
  return data.data;
}

export async function uploadSystemAssetsApi(files: {
  logo?: File | null;
  favicon?: File | null;
  splashScreen?: File | null;
  appIcon?: File | null;
  loginBackground?: File | null;
  loginLogo?: File | null;
}) {
  const formData = new FormData();
  if (files.logo) formData.append("logo", files.logo);
  if (files.favicon) formData.append("favicon", files.favicon);
  if (files.splashScreen) formData.append("splashScreen", files.splashScreen);
  if (files.appIcon) formData.append("appIcon", files.appIcon);
  if (files.loginBackground) formData.append("loginBackground", files.loginBackground);
  if (files.loginLogo) formData.append("loginLogo", files.loginLogo);

  const { data } = await http.post<ApiResponse<SystemSettings>>("/admin/system-settings/assets", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data;
}

export type AppearanceSettings = {
  logo: string;
  loginLogo: string;
  loginBackground: string;
  dashboardTheme: string;
  colorMode: "dark" | "light" | "system";
  darkModeEnabled: boolean;
  lightModeEnabled: boolean;
};

export async function fetchAppearanceSettings() {
  const settings = await fetchSystemSettings();
  return (
    settings.appearance || {
      logo: settings.general.logo || "",
      loginLogo: "",
      loginBackground: settings.application.loginBackground || "",
      dashboardTheme: "emerald",
      colorMode: "system",
      darkModeEnabled: true,
      lightModeEnabled: true,
    }
  );
}

export async function updateAppearanceSettingsApi(payload: Partial<AppearanceSettings>) {
  const { data } = await http.patch<ApiResponse<SystemSettings>>("/admin/system-settings", {
    appearance: payload,
  });
  return data.data.appearance as AppearanceSettings;
}

export async function uploadAppearanceAssetsApi(files: {
  logo?: File | null;
  loginLogo?: File | null;
  loginBackground?: File | null;
}) {
  const settings = await uploadSystemAssetsApi({
    logo: files.logo,
    loginLogo: files.loginLogo,
    loginBackground: files.loginBackground,
  });
  return settings.appearance as AppearanceSettings;
}

export type PermissionActions = {
  view: boolean;
  create: boolean;
  update: boolean;
  delete: boolean;
};

export type RolePermissionsPayload = {
  roles: Array<{
    id: string;
    name: string;
    permissions: Record<string, PermissionActions>;
  }>;
  modules: string[];
  actions: Array<keyof PermissionActions>;
};

export async function fetchRolesPermissions() {
  const { data } = await http.get<ApiResponse<RolePermissionsPayload>>("/admin/roles-permissions");
  return data.data;
}

export async function createRoleApi(name: string) {
  const { data } = await http.post("/admin/roles-permissions/roles", { name });
  return data;
}

export async function updateRoleApi(
  roleId: string,
  payload: { name?: string; permissions?: Record<string, PermissionActions> }
) {
  const { data } = await http.patch(`/admin/roles-permissions/roles/${roleId}`, payload);
  return data;
}

export async function deleteRoleApi(roleId: string) {
  await http.delete(`/admin/roles-permissions/roles/${roleId}`);
}

export type JoinUsApplicationListItem = {
  id: string;
  applicationType: string;
  applicantName: string;
  companyName?: string;
  phone: string;
  city: string;
  status: string;
  createdAt: string;
};

export type JoinUsApplicationDetail = {
  id: string;
  applicationType: string;
  status: string;
  fullName: string;
  companyName?: string;
  phone: string;
  email?: string;
  city: string;
  bio?: string;
  whatsappNumber?: string;
  profileImage?: string;
  idImage?: string;
  licenseImage?: string;
  commercialReg?: string;
  businessLicense?: string;
  description?: string;
  specializations?: string[];
  otherTypeLabel?: string;
  yearsOfExperience?: number;
  adminNote?: string;
  reviewedAt?: string;
  createdAt: string;
  review: {
    kind: "company" | "serviceProvider" | "other";
    approveButtonText: string;
    fields: Record<string, unknown>;
  };
};

export type JoinUsTab =
  | "ALL"
  | "COMPANIES"
  | "DOCTORS"
  | "ENGINEERS"
  | "CONSULTANTS"
  | "BROKERS"
  | "TRANSPORT"
  | "OTHERS";

export async function fetchJoinUsApplications(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  tab?: JoinUsTab;
}) {
  const { data } = await http.get<ApiResponse<JoinUsApplicationListItem[]>>("/admin/join-us", { params });
  return {
    items: data.data,
    meta: data.meta as { page?: number; limit?: number; total?: number; totalPages?: number },
  };
}

export async function fetchJoinUsApplicationById(applicationId: string) {
  const { data } = await http.get<ApiResponse<JoinUsApplicationDetail>>(`/admin/join-us/${applicationId}`);
  return data.data;
}

export async function approveJoinUsApplicationApi(
  applicationId: string,
  payload: { email?: string; password?: string; maxProducts?: number; adminNote?: string }
) {
  const { data } = await http.post<ApiResponse<{
    application: JoinUsApplicationDetail;
    credentials?: { email: string; password: string; deliveryChannels: string[] };
  }>>(`/admin/join-us/${applicationId}/approve`, payload);
  return data.data;
}

export async function rejectJoinUsApplicationApi(applicationId: string, payload: { adminNote?: string }) {
  const { data } = await http.post<ApiResponse<JoinUsApplicationDetail>>(`/admin/join-us/${applicationId}/reject`, payload);
  return data.data;
}
