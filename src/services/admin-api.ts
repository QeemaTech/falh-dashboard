import { http } from "./http";
import type { AiSettings, AiSettingsPayload } from "../types/ai";
import type { DashboardStats, User, UserAdminDetails } from "../types/dashboard";
import type { LatestMarketData, LivestockCategory, MarketItem, MarketPagination, MarketTrend } from "../types/market";

type ApiResponse<T> = { success: boolean; data: T; message?: string; meta?: { total?: number; page?: number; limit?: number } };

export async function fetchDashboardStats() {
  const { data } = await http.get<ApiResponse<DashboardStats>>("/admin/dashboard/stats");
  return data.data;
}

export async function fetchUsers(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  role?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { data } = await http.get<ApiResponse<User[]>>("/admin/users", { params });
  return { users: data.data, meta: data.meta };
}

export async function fetchUserDetails(userId: string) {
  const { data } = await http.get<ApiResponse<UserAdminDetails>>(`/admin/users/${userId}`);
  return data.data;
}

export async function activateUserApi(userId: string) {
  const { data } = await http.patch<ApiResponse<User>>(`/admin/users/${userId}/activate`);
  return data.data;
}

export async function suspendUserApi(userId: string) {
  const { data } = await http.patch<ApiResponse<User>>(`/admin/users/${userId}/suspend`);
  return data.data;
}

export type AdminOrderStatus = "PENDING" | "CONFIRMED" | "PREPARING" | "DELIVERED" | "CANCELLED";
export type AdminPaymentMethod = "CASH" | "MASTERCARD" | "VISA" | "APPLE_PAY";

export type AdminOrderItem = {
  id: string;
  title: string;
  price: number;
  quantity: number;
  unit?: string | null;
  product?: { id: string; images?: Array<{ path: string }> };
};

export type AdminOrderAddress = {
  label?: string | null;
  city?: string | null;
  district?: string | null;
  street?: string | null;
};

export type AdminOrderStatusHistory = {
  id: string;
  status: AdminOrderStatus;
  note?: string | null;
  createdAt: string;
};

export type AdminOrder = {
  id: string;
  status: AdminOrderStatus;
  subtotal?: number;
  discount?: number;
  total: number;
  paymentMethod?: AdminPaymentMethod;
  isPaid?: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt?: string;
  user?: { id?: string; name?: string; phone?: string; email?: string };
  address?: AdminOrderAddress | null;
  items?: AdminOrderItem[];
  statusHistory?: AdminOrderStatusHistory[];
};

export type AdminBanner = {
  id: string;
  title: string;
  titleAr?: string;
  titleEn?: string;
  imagePath: string;
  linkType?: string;
  linkValue?: string;
  sortOrder: number;
  isActive: boolean;
  displayDays?: number | null;
  expiresAt?: string | null;
  createdAt: string;
};

export type AdminProduct = {
  id: string;
  title: string;
  titleAr?: string;
  titleEn?: string;
  description?: string;
  descriptionAr?: string;
  descriptionEn?: string;
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
  images?: Array<{ id: string; path: string; sortOrder?: number }>;
  fieldValues?: Array<{
    fieldId?: string;
    value?: string | null;
    fileUrl?: string | null;
    field?: { id: string };
  }>;
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

export async function fetchAdminOrderById(orderId: string) {
  const { data } = await http.get<ApiResponse<AdminOrder>>(`/orders/${orderId}`);
  return data.data;
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

export async function uploadAdminProductImagesApi(files: File[]) {
  const formData = new FormData();
  files.forEach((file) => formData.append("images", file));
  const { data } = await http.post<ApiResponse<{ paths: string[] }>>("/admin/products/upload-images", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data.data.paths;
}

export type ProductFormPayload = {
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
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
  const { data } = await http.get<ApiResponse<CompanyApplication[]>>("/admin/company-applications", { params });
  return {
    items: data.data,
    meta: data.meta as { page?: number; limit?: number; total?: number; totalPages?: number },
  };
}

export async function fetchCompanyApplicationById(applicationId: string) {
  const { data } = await http.get<ApiResponse<CompanyApplication & {
    description?: string;
    businessLicense?: string;
    commercialReg?: string;
    email?: string;
  }>>(`/admin/company-applications/${applicationId}`);
  return data.data;
}

export async function fetchServiceProvidersCount() {
  const { data } = await http.get<ApiResponse<unknown[]>>("/admin/service-providers", {
    params: { page: 1, limit: 1, sortBy: "createdAt", sortOrder: "desc" },
  });
  return Number(data.meta?.total || 0);
}

export type AdminServiceProvider = {
  id: string;
  name?: string;
  displayName?: string | null;
  type: string;
  status: string;
  city: string;
  bio?: string | null;
  contactNumber?: string | null;
  whatsappNumber?: string | null;
  whatsappLink?: string | null;
  callLink?: string | null;
  specializations?: string[];
  yearsOfExperience?: number | null;
  rating?: number;
  reviewCount?: number;
  idImagePath?: string | null;
  licensePath?: string | null;
  applicationType?: string | null;
  otherTypeLabel?: string | null;
  user?: { id: string; name?: string; profileImage?: string | null };
};

export async function fetchAdminServiceProviders(params: {
  page: number;
  limit: number;
  status?: string;
  applicationType?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}) {
  const { data } = await http.get<ApiResponse<AdminServiceProvider[]>>("/admin/service-providers", { params });
  return {
    items: data.data,
    meta: data.meta as { page?: number; limit?: number; total?: number; totalPages?: number },
  };
}

export async function fetchServiceProviderById(providerId: string) {
  const { data } = await http.get<ApiResponse<AdminServiceProvider>>(`/service-providers/${providerId}`);
  return data.data;
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
  displayDays?: number;
  listingExpiresAt?: string | null;
  createdAt: string;
  description?: string;
  commercialReg?: string;
  businessLicense?: string;
  applicantName?: string;
  email_public?: string;
  user?: { id: string; name?: string; email?: string; phone?: string; status?: string };
  joinApplication?: {
    id: string;
    status: string;
    fullName?: string;
    email?: string;
    description?: string;
    commercialReg?: string;
    businessLicense?: string;
  } | null;
};

export async function fetchAdminCompanyDetails(companyId: string) {
  const { data } = await http.get<ApiResponse<AdminCompany>>(`/admin/companies/${companyId}`);
  return data.data;
}

export async function approveCompanyWithCredentialsApi(
  companyId: string,
  payload: { email: string; password: string; maxProducts: number; displayDays: number; adminNote?: string }
) {
  const { data } = await http.patch<
    ApiResponse<{ credentials?: { email: string; password: string } }>
  >(`/admin/companies/${companyId}/approve`, payload);
  return data.data;
}

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
    displayDays?: number;
    email?: string;
    password?: string;
    adminNote?: string;
    companyStatus?: string;
  }
) {
  if (payload.action === "REJECT") {
    const { data } = await http.post<ApiResponse<unknown>>(`/admin/company-applications/${applicationId}/reject`, {
      adminNote: payload.adminNote,
    });
    return data;
  }
  const { data } = await http.post<ApiResponse<{ credentials?: { email: string; password: string } }>>(
    `/admin/company-applications/${applicationId}/approve`,
    {
      maxProducts: payload.maxProducts,
      displayDays: payload.displayDays,
      email: payload.email,
      password: payload.password,
      adminNote: payload.adminNote,
      companyStatus: payload.companyStatus,
    }
  );
  return data;
}

export async function setCompanyStatusApi(
  companyId: string,
  action: "approve" | "reject" | "suspend" | "unsuspend",
  adminNote?: string
) {
  const { data } = await http.patch(`/admin/companies/${companyId}/${action}`, { adminNote });
  return data;
}

export async function assignCompanyProductLimitApi(
  companyId: string,
  payload: { maxProducts: number; displayDays?: number }
) {
  const { data } = await http.patch(`/admin/companies/${companyId}/product-limit`, payload);
  return data;
}

export async function resetCompanyPasswordApi(companyId: string, newPassword?: string) {
  const { data } = await http.post<
    ApiResponse<{ companyId: string; userId: string; generatedPassword: string }>
  >(`/admin/companies/${companyId}/reset-password`, { newPassword });
  return data.data;
}

export type CompanyFinanceSummary = {
  companyId: string;
  companyName: string;
  companyStatus: string;
  city: string;
  commissionRate: number;
  ordersCount: number;
  itemsCount: number;
  grossSales: number;
  commissionAmount: number;
  netToCompany: number;
};

export type FinanceTotals = {
  grossSales: number;
  commissionAmount: number;
  netToCompany: number;
  ordersCount: number;
  companiesCount: number;
};

export type CompanyFinanceOrderItem = {
  id: string;
  title: string;
  quantity: number;
  unit: string;
  price: number;
  lineTotal: number;
};

export type CompanyFinanceOrder = {
  orderId: string;
  status: string;
  createdAt: string;
  customerName: string;
  customerPhone?: string | null;
  companyGross: number;
  commissionAmount: number;
  netToCompany: number;
  items: CompanyFinanceOrderItem[];
};

export type CompanyFinanceDetails = {
  company: {
    id: string;
    name: string;
    status: string;
    city: string;
    commissionRate: number;
    phone?: string;
    user?: { email?: string | null };
  };
  summary: CompanyFinanceSummary;
  orders: CompanyFinanceOrder[];
};

export async function fetchFinanceOverview(params?: { search?: string; status?: string }) {
  const { data } = await http.get<ApiResponse<CompanyFinanceSummary[]>>("/admin/finance/companies", {
    params,
  });
  return {
    items: data.data,
    totals: (data.meta || {}) as FinanceTotals,
  };
}

export async function fetchCompanyFinanceDetails(companyId: string) {
  const { data } = await http.get<ApiResponse<CompanyFinanceDetails>>(`/admin/finance/companies/${companyId}`);
  return data.data;
}

export async function updateCompanyCommissionApi(companyId: string, commissionRate: number) {
  const { data } = await http.patch<ApiResponse<CompanyFinanceSummary>>(
    `/admin/finance/companies/${companyId}/commission`,
    { commissionRate }
  );
  return data.data;
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

export type { MarketItem, MarketTrend, LatestMarketData, LivestockCategory, MarketPagination } from "../types/market";

export type MarketPriceRefreshResult = {
  batchRecordedAt: string;
  requested: number;
  saved: number;
  created: number;
  updated: number;
  removedSeed?: number;
  source: string;
  fallback?: boolean;
  message?: string;
  error?: string;
};

export async function fetchAdminMarketPrices(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  trend?: MarketTrend;
  fromDate?: string;
  toDate?: string;
  sortBy?: "price" | "cropName" | "recordedAt" | "createdAt";
  sortOrder?: "asc" | "desc";
}) {
  const { data } = await http.get<ApiResponse<MarketItem[]>>("/admin/market-prices", { params });
  const meta = data.meta as MarketPagination & { total?: number; hasNext?: boolean; hasPrev?: boolean };
  return {
    items: data.data,
    pagination: {
      page: meta.page ?? params.page ?? 1,
      limit: meta.limit ?? params.limit ?? 10,
      totalItems: meta.totalItems ?? meta.total ?? data.data.length,
      totalPages: meta.totalPages ?? 1,
      hasNextPage: meta.hasNextPage ?? meta.hasNext ?? false,
      hasPreviousPage: meta.hasPreviousPage ?? meta.hasPrev ?? false,
    } satisfies MarketPagination,
  };
}

export async function refreshMarketPricesApi() {
  const { data } = await http.post<ApiResponse<MarketPriceRefreshResult>>("/admin/market-prices/refresh");
  return { ...data.data, apiMessage: data.message };
}

export async function fetchMarketPriceCategoriesApi() {
  const { data } = await http.get<ApiResponse<string[]>>("/admin/market-prices/categories");
  return data.data;
}

export async function fetchAdminCropPrices(params?: {
  page?: number;
  limit?: number;
  cropName?: string;
  trend?: MarketTrend;
  view?: "latest" | "history";
  fromDate?: string;
  toDate?: string;
}) {
  const { data } = await http.get<ApiResponse<MarketItem[]>>("/admin/crop-prices", {
    params: { view: "latest", ...(params || {}) },
  });
  return {
    items: data.data,
    meta: data.meta as { page?: number; limit?: number; total?: number; totalPages?: number },
  };
}

export async function fetchLatestMarketDataApi() {
  const { data } = await http.get<ApiResponse<LatestMarketData>>("/market/latest");
  return data.data;
}

export async function fetchLatestCropPricesApi(params?: { cropName?: string; trend?: MarketTrend }) {
  const { data } = await http.get<ApiResponse<MarketItem[]>>("/crop-prices/latest", { params });
  return data.data;
}

export async function fetchLatestLivestockPricesApi(category: LivestockCategory = "livestock") {
  const { data } = await http.get<ApiResponse<MarketItem[]>>("/livestock-prices/latest", {
    params: { category },
  });
  return data.data;
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

export type { AiSettings, AiSettingsPayload } from "../types/ai";

export async function fetchAiSettingsApi() {
  const { data } = await http.get<ApiResponse<AiSettings>>("/admin/ai/settings");
  const { normalizeAiSettings } = await import("../types/ai");
  return normalizeAiSettings(data.data);
}

export async function updateAiSettingsApi(payload: AiSettingsPayload) {
  const { data } = await http.patch<ApiResponse<AiSettings>>("/admin/ai/settings", payload);
  const { normalizeAiSettings } = await import("../types/ai");
  return normalizeAiSettings(data.data);
}

export async function fetchAdminBanners() {
  const { data } = await http.get<ApiResponse<AdminBanner[]>>("/admin/banners");
  return data.data;
}

export type BannerFormPayload = {
  titleAr: string;
  titleEn: string;
  image: File;
  linkType?: string;
  linkValue?: string;
  sortOrder?: number;
  isActive?: boolean;
  displayDays?: number | null;
};

export async function createAdminBannerApi(payload: BannerFormPayload) {
  const formData = new FormData();
  formData.append("titleAr", payload.titleAr);
  formData.append("titleEn", payload.titleEn);
  formData.append("image", payload.image);
  if (payload.linkType) formData.append("linkType", payload.linkType);
  if (payload.linkValue) formData.append("linkValue", payload.linkValue);
  formData.append("sortOrder", String(payload.sortOrder ?? 0));
  if (payload.displayDays != null && payload.displayDays > 0) {
    formData.append("displayDays", String(payload.displayDays));
  }
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

export type RbacRole = {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  isSystemRole: boolean;
  permissions: string[] | Record<string, PermissionActions>;
  assignedUsers?: number;
};

export type RolePermissionsPayload = {
  roles: Array<{
    id: string;
    name: string;
    slug?: string;
    description?: string | null;
    isSystemRole?: boolean;
    permissions: Record<string, PermissionActions>;
  }>;
  modules: string[];
  actions: Array<keyof PermissionActions>;
  permissionCodes?: string[];
};

export type PermissionRecord = {
  id: string;
  module: string;
  action: string;
  code: string;
};

export async function fetchRolesPermissions() {
  const { data } = await http.get<ApiResponse<RolePermissionsPayload>>("/admin/roles-permissions");
  return data.data;
}

export async function fetchAdminRoles() {
  const { data } = await http.get<ApiResponse<RbacRole[]>>("/admin/roles");
  return data.data;
}

export async function fetchAdminPermissions() {
  const { data } = await http.get<ApiResponse<PermissionRecord[]>>("/admin/permissions");
  return data.data;
}

export async function createRoleApi(payload: {
  name: string;
  description?: string;
  permissions?: Record<string, PermissionActions>;
}) {
  const { data } = await http.post<ApiResponse<RbacRole>>("/admin/roles", payload);
  return data.data;
}

export async function updateRoleApi(
  roleId: string,
  payload: { name?: string; description?: string; permissions?: Record<string, PermissionActions> }
) {
  const { data } = await http.put<ApiResponse<RbacRole>>(`/admin/roles/${roleId}`, payload);
  return data.data;
}

export async function deleteRoleApi(roleId: string) {
  await http.delete(`/admin/roles/${roleId}`);
}

export async function fetchUserAdminRole(userId: string) {
  const { data } = await http.get<ApiResponse<{ userId: string; role: RbacRole | null }>>(
    `/admin/users/${userId}/role`
  );
  return data.data;
}

export async function assignUserAdminRoleApi(userId: string, roleId: string) {
  const { data } = await http.put<ApiResponse<{ userId: string; role: RbacRole }>>(
    `/admin/users/${userId}/role`,
    { roleId }
  );
  return data.data;
}

export type JoinUsApplicationListItem = {
  id: string;
  applicationType: string;
  applicantName: string;
  companyName?: string;
  phone: string;
  email?: string;
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

export type JoinUsTab = "ALL" | string;

export type JoinApplicationType = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: "COMPANY" | "PROVIDER";
  serviceProviderType?: string | null;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchJoinApplicationTypes() {
  const { data } = await http.get<ApiResponse<JoinApplicationType[]>>("/admin/join-us/types");
  return data.data;
}

export async function createJoinApplicationTypeApi(payload: {
  nameAr: string;
  nameEn: string;
  code?: string;
  serviceProviderType?: string;
  sortOrder?: number;
}) {
  const { data } = await http.post<ApiResponse<JoinApplicationType>>("/admin/join-us/types", payload);
  return data.data;
}

export async function updateJoinApplicationTypeApi(
  typeId: string,
  payload: Partial<{ nameAr: string; nameEn: string; isActive: boolean; sortOrder: number; serviceProviderType: string }>
) {
  const { data } = await http.patch<ApiResponse<JoinApplicationType>>(`/admin/join-us/types/${typeId}`, payload);
  return data.data;
}

export async function deleteJoinApplicationTypeApi(typeId: string) {
  const { data } = await http.delete<ApiResponse<JoinApplicationType | { id: string; deleted: boolean }>>(
    `/admin/join-us/types/${typeId}`
  );
  return data.data;
}

export async function fetchJoinUsApplications(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  tab?: JoinUsTab;
}) {
  const { data } = await http.get<ApiResponse<JoinUsApplicationListItem[]>>("/admin/join-us", {
    params: {
      page: params.page,
      limit: params.limit,
      search: params.search,
      status: params.status,
      tab: params.tab || "ALL",
    },
  });
  return {
    items: data.data,
    meta: data.meta as { page?: number; limit?: number; total?: number; totalPages?: number },
  };
}

export async function fetchJoinUsApplicationById(applicationId: string) {
  const { data } = await http.get<ApiResponse<JoinUsApplicationDetail>>(
    `/admin/join-us/${applicationId}`
  );
  return data.data;
}

export async function approveJoinUsApplicationApi(
  applicationId: string,
  payload: { email?: string; password?: string; maxProducts?: number; displayDays?: number; adminNote?: string }
) {
  const { data } = await http.post<
    ApiResponse<{
      credentials?: { email: string; password: string; deliveryChannels?: string[] };
    }>
  >(`/admin/join-us/${applicationId}/approve`, payload);
  return data.data;
}

export async function rejectJoinUsApplicationApi(
  applicationId: string,
  payload: { adminNote?: string }
) {
  const { data } = await http.post<ApiResponse<JoinUsApplicationDetail>>(
    `/admin/join-us/${applicationId}/reject`,
    payload
  );
  return data.data;
}
