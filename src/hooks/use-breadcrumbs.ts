import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "./use-i18n";

export function useBreadcrumbs() {
  const location = useLocation();
  const { t } = useI18n();
  return useMemo(() => {
    const routeLabelMap: Record<string, string> = {
      users: "nav.users",
      companies: "nav.companies",
      products: "nav.products",
      categories: "nav.categories",
      orders: "nav.orders",
      banners: "nav.banners",
      notifications: "nav.notifications",
      consultants: "nav.consultants",
      "ai-settings": "nav.aiSettings",
      "crop-prices": "nav.cropPrices",
      "weather-settings": "nav.weatherSettings",
      "system-settings": "nav.systemSettings",
      "roles-permissions": "nav.rolesPermissions",
    };
    const chunks = location.pathname.split("/").filter(Boolean);
    return chunks.map((chunk, index) => ({
      label: t(routeLabelMap[chunk] || "", decodeURIComponent(chunk).replace(/-/g, " ")),
      href: `/${chunks.slice(0, index + 1).join("/")}`,
    }));
  }, [location.pathname, t]);
}
