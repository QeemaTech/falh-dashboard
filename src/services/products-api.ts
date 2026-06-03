import { http } from "./http";
import type { AdminProduct, ProductFormPayload } from "./admin-api";

type ApiResponse<T> = { success: boolean; data: T; meta?: { total?: number; page?: number; limit?: number } };

export type CompanyQuota = {
  maxProducts: number;
  used: number;
  remaining: number;
  canAdd: boolean;
  companyStatus: string;
};

export async function fetchMyProducts(params: {
  page: number;
  limit: number;
  search?: string;
  status?: string;
}) {
  const { data } = await http.get<ApiResponse<AdminProduct[]>>("/products/me", { params });
  return { items: data.data, meta: data.meta };
}

export type ProductCategory = { id: string; nameAr?: string; nameEn?: string };

export async function fetchProductCategories() {
  const { data } = await http.get<ApiResponse<ProductCategory[]>>("/products/categories");
  return data.data;
}

export async function fetchCompanyQuota() {
  const { data } = await http.get<ApiResponse<CompanyQuota>>("/products/me/quota");
  return data.data;
}

export async function createCompanyProductApi(payload: ProductFormPayload & { isDraft?: boolean }) {
  const { data } = await http.post<ApiResponse<AdminProduct>>("/products", payload);
  return data.data;
}

export async function updateCompanyProductApi(
  productId: string,
  payload: Partial<ProductFormPayload> & { isDraft?: boolean; submit?: boolean }
) {
  const { data } = await http.patch<ApiResponse<AdminProduct>>(`/products/${productId}`, payload);
  return data.data;
}

export async function deleteCompanyProductApi(productId: string) {
  await http.delete(`/products/${productId}`);
}

export async function fetchProductById(productId: string) {
  const { data } = await http.get<ApiResponse<AdminProduct>>(`/products/${productId}`);
  return data.data;
}
