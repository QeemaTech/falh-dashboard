import axios from "axios";
import { getAccessToken, getRefreshToken, setAccessToken, setRefreshToken, clearAuthSession } from "./auth-storage";
import { refreshTokenApi } from "./auth-api";

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api",
  timeout: 20_000,
});

http.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise: Promise<string> | null = null;

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as {
      _retry?: boolean;
      headers: Record<string, string>;
    };
    if (error.response?.status !== 401 || originalRequest?._retry) {
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      clearAuthSession();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      if (!refreshPromise) {
        refreshPromise = refreshTokenApi(refreshToken).then((result) => {
          setAccessToken(result.accessToken);
          setRefreshToken(result.refreshToken);
          return result.accessToken;
        });
      }

      const newAccessToken = await refreshPromise;
      refreshPromise = null;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return http(originalRequest);
    } catch (refreshError) {
      refreshPromise = null;
      clearAuthSession();
      return Promise.reject(refreshError);
    }
  }
);
