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
