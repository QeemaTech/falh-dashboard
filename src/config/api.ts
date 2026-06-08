const DEFAULT_API_BASE_URL = "http://localhost:3000/api";

function normalizeApiBaseUrl(raw: string) {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return DEFAULT_API_BASE_URL;
  if (trimmed.endsWith("/api")) return trimmed;
  return `${trimmed}/api`;
}

/** Axios base URL — set `VITE_API_URL` in `.env` (e.g. https://falh.nodeteam.site). */
export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL ?? DEFAULT_API_BASE_URL);

/** Origin for static uploads (logo, product images, etc.). */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
