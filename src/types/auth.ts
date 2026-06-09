export type AdminRoleSummary = {
  id: string;
  name: string;
  slug?: string;
};

export type AuthUser = {
  id: string;
  name: string;
  email?: string;
  role: "USER" | "ADMIN" | "COMPANY";
  permissions?: string[];
  adminRole?: AdminRoleSummary | null;
  isSuperAdmin?: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  rememberMe: boolean;
};

export type LoginPayload = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export type LoginResponse = {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
};
