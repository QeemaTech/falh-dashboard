import { http } from "./http";

export type CompanyJoinApplicationPayload = {
  companyName: string;
  fullName: string;
  phone: string;
  city: string;
  email?: string;
  whatsappNumber?: string;
  description?: string;
  commercialRegFile?: File | null;
  businessLicenseFile?: File | null;
  profileImageFile?: File | null;
};

export async function submitCompanyJoinApplicationApi(payload: CompanyJoinApplicationPayload) {
  const formData = new FormData();
  formData.append("applicationType", "COMPANY");
  formData.append("companyName", payload.companyName.trim());
  formData.append("fullName", payload.fullName.trim());
  formData.append("phone", payload.phone.trim());
  formData.append("city", payload.city.trim());

  if (payload.email?.trim()) {
    formData.append("email", payload.email.trim().toLowerCase());
  }
  if (payload.whatsappNumber?.trim()) {
    formData.append("whatsappNumber", payload.whatsappNumber.trim());
  }
  if (payload.description?.trim()) {
    formData.append("description", payload.description.trim());
  }
  if (payload.commercialRegFile) {
    formData.append("commercialReg", payload.commercialRegFile);
  }
  if (payload.businessLicenseFile) {
    formData.append("businessLicense", payload.businessLicenseFile);
  }
  if (payload.profileImageFile) {
    formData.append("profileImage", payload.profileImageFile);
  }

  const { data } = await http.post<{ success: boolean; message: string; data: unknown }>(
    "/join-us",
    formData
  );
  return data;
}
