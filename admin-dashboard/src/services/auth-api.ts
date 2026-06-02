import { http } from "./http";
import type { LoginPayload, LoginResponse } from "../types/auth";

type ApiResponse<T> = { success: boolean; data: T };

export async function loginApi(payload: LoginPayload) {
  const { data } = await http.post<ApiResponse<LoginResponse>>("/auth/login", payload);
  return data.data;
}

export async function refreshTokenApi(refreshToken: string) {
  const { data } = await http.post<ApiResponse<LoginResponse>>("/auth/refresh-token", { refreshToken });
  return data.data;
}
