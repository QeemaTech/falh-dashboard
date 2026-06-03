import axios from "axios";
import { http } from "./http";
import type { LoginPayload, LoginResponse } from "../types/auth";

type ApiResponse<T> = { success: boolean; data: T };

const authHttp = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api",
  timeout: 20_000,
});

export async function loginApi(payload: LoginPayload) {
  const { data } = await http.post<ApiResponse<LoginResponse>>("/auth/login", payload);
  return data.data;
}

export async function refreshTokenApi(refreshToken: string) {
  const { data } = await authHttp.post<ApiResponse<LoginResponse>>("/auth/refresh-token", { refreshToken });
  return data.data;
}
