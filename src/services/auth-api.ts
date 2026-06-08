import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { http } from "./http";
import type { LoginPayload, LoginResponse } from "../types/auth";

type ApiResponse<T> = { success: boolean; data: T };

const authHttp = axios.create({
  baseURL: API_BASE_URL,
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
