export type DashboardPeriod = "today" | "week" | "month";

export type DashboardSeriesPoint = {
  date: string;
  sales: number;
  orders: number;
  users: number;
  products: number;
};

export type DashboardStats = {
  period?: DashboardPeriod;
  periodStart?: string;
  periodEnd?: string;
  totalUsers: number;
  totalCompanies: number;
  totalProducts: number;
  pendingProducts: number;
  pendingCompanies: number;
  pendingServiceProviders: number;
  totalOrders: number;
  revenue: number;
  serviceProviders?: number;
  totals?: {
    totalUsers: number;
    totalCompanies: number;
    totalProducts: number;
    pendingProducts: number;
    pendingCompanies: number;
    pendingServiceProviders: number;
    totalOrders: number;
    revenue: number;
    serviceProviders: number;
  };
  periodTotals?: {
    users: number;
    companies: number;
    products: number;
    orders: number;
    revenue: number;
  };
  changes?: {
    users: number;
    companies: number;
    products: number;
    orders: number;
    revenue: number;
  };
  productStatus?: {
    pending: number;
    active: number;
    rejected: number;
    draft: number;
    total: number;
  };
  series?: DashboardSeriesPoint[];
  recent?: {
    orders: Array<{
      id: string;
      status: string;
      total: number;
      createdAt: string;
      user?: { id?: string; name?: string; phone?: string } | null;
    }>;
    users: Array<{
      id: string;
      name: string;
      email?: string;
      phone?: string;
      role: string;
      status: string;
      createdAt: string;
    }>;
    products: Array<{
      id: string;
      title: string;
      status: string;
      price?: number;
      createdAt: string;
      company?: { id: string; name: string } | null;
    }>;
  };
};

export type User = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: "USER" | "ADMIN" | "COMPANY";
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  isPhoneVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type UserAdminDetails = User & {
  profileImage?: string | null;
  stats: {
    ordersCount: number;
    productsCount: number;
    addressesCount: number;
    notificationsCount: number;
    cartItemsCount: number;
    aiConversationsCount: number;
    ordersTotalAmount: number;
  };
  recentOrders: Array<{ id: string; status: string; total: number; createdAt: string }>;
  pendingApplication?: {
    id: string;
    applicationType: string;
    companyName?: string | null;
    fullName: string;
    city: string;
    status: string;
    createdAt: string;
  } | null;
  company?: {
    id: string;
    name: string;
    city: string;
    status: string;
    phone: string;
    maxProducts?: number;
    productsCount?: number;
    rating?: number;
  } | null;
  serviceProvider?: {
    id: string;
    displayName?: string | null;
    type: string;
    city?: string;
    status: string;
    rating?: number;
  } | null;
};
