import { http } from "./http";

type ApiResponse<T> = { success: boolean; data: T };

export type PublicBranding = {
  projectName: string;
  footerText: string;
  logo: string;
  favicon: string;
  loginLogo: string;
  loginBackground: string;
  currency: string;
  language: string;
};

export async function fetchPublicBranding() {
  const { data } = await http.get<ApiResponse<PublicBranding>>("/settings/branding");
  return data.data;
}
