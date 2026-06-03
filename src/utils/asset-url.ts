const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";
const assetOrigin = apiBase.replace(/\/api\/?$/, "");

export function resolveAssetUrl(path?: string | null) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${assetOrigin}${path.startsWith("/") ? path : `/${path}`}`;
}
