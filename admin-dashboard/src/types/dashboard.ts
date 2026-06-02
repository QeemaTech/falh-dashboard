export type DashboardStats = {
  totalUsers: number;
  totalCompanies: number;
  totalProducts: number;
  pendingProducts: number;
  pendingCompanies: number;
  pendingServiceProviders: number;
  totalOrders: number;
  revenue: number;
};

export type User = {
  id: string;
  name: string;
  email?: string;
  phone: string;
  role: "USER" | "ADMIN" | "COMPANY";
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  createdAt: string;
};
