import { http } from "./http";
import type { AdminProduct } from "./admin-api";
import type { CompanyQuota } from "./products-api";

type ApiResponse<T> = { success: boolean; data: T; meta?: unknown };

export type CompanyProfile = {
  id: string;
  name: string;
  logo?: string | null;
  description?: string | null;
  city: string;
  address?: string | null;
  phone: string;
  whatsappNumber?: string | null;
  emailPublic?: string | null;
  maxProducts: number;
  productsCount: number;
  displayDays: number;
  listingExpiresAt?: string | null;
  listingActive: boolean;
  status: string;
  applicantName?: string | null;
  rating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
  loginEmail?: string | null;
  accountName?: string | null;
};

export type CompanyDashboard = {
  company: CompanyProfile;
  quota: CompanyQuota;
  products: {
    total: number;
    active: number;
    pending: number;
    rejected: number;
    draft: number;
    sold: number;
    expired: number;
  };
  recentProducts: AdminProduct[];
};

export async function fetchCompanyProfile() {
  const { data } = await http.get<ApiResponse<CompanyProfile>>("/company/me");
  return data.data;
}

export async function uploadCompanyLogoApi(file: File) {
  const formData = new FormData();
  formData.append("logo", file);
  const { data } = await http.post<ApiResponse<CompanyProfile>>("/company/me/logo", formData);
  return data.data;
}

export async function fetchCompanyDashboard() {
  const { data } = await http.get<ApiResponse<CompanyDashboard>>("/company/dashboard");
  return data.data;
}
