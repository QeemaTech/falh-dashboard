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

export type PublicContactLink = {
  labelAr: string;
  labelEn: string;
  value: string;
  action: string;
};

export type PublicSocialItem = {
  platform: "whatsapp" | "facebook" | "instagram" | "tiktok" | "youtube" | string;
  labelAr: string;
  labelEn: string;
  url: string;
};

export type PublicContact = {
  phone: PublicContactLink;
  partnerships: {
    labelAr: string;
    labelEn: string;
    email: PublicContactLink;
  };
  support: {
    labelAr: string;
    labelEn: string;
    email: PublicContactLink;
  };
  social: PublicSocialItem[];
  raw: {
    contact: {
      phone: string;
      partnersEmail: string;
      supportEmail: string;
      whatsapp: string;
      address: string;
    };
    social: {
      whatsapp: string;
      facebook: string;
      instagram: string;
      tiktok: string;
      youtube: string;
      x: string;
    };
  };
};

export async function fetchPublicBranding() {
  const { data } = await http.get<ApiResponse<PublicBranding>>("/settings/branding");
  return data.data;
}

export async function fetchPublicContact() {
  const { data } = await http.get<ApiResponse<PublicContact>>("/settings/contact");
  return data.data;
}
