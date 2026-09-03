import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "./use-i18n";

export function useBreadcrumbs() {
  const location = useLocation();
  const { t } = useI18n();
  return useMemo(() => {
    const isCompany = location.pathname.startsWith("/company");
    const routeLabelMap: Record<string, string> = {
      company: "company.nav.dashboard",
      users: "nav.users",
      companies: "nav.companies",
      products: isCompany ? "company.nav.products" : "nav.products",
      profile: "company.nav.profile",
      categories: "nav.categories",
      orders: "nav.orders",
      finance: "nav.finance",
      banners: "nav.banners",
      notifications: isCompany ? "company.nav.notifications" : "nav.notifications",
      consultants: "nav.consultants",
      "ai-settings": "nav.aiSettings",
      "crop-prices": "nav.market",
      market: "nav.market",
      "weather-settings": "nav.weatherSettings",
      "content-management": "nav.contentManagement",
      faq: "nav.contentManagement",
      terms: "nav.contentManagement",
      "privacy-policy": "nav.contentManagement",
      "system-settings": "nav.systemSettings",
      "roles-permissions": "nav.rolesPermissions",
    };
    const chunks = location.pathname.split("/").filter(Boolean);
    return chunks
      .map((chunk, index) => ({
        chunk,
        index,
        href: `/${chunks.slice(0, index + 1).join("/")}`,
        label: t(routeLabelMap[chunk] || "", decodeURIComponent(chunk).replace(/-/g, " ")),
      }))
      .filter((crumb) => !(isCompany && crumb.chunk === "company" && chunks.length > 1))
      .map(({ label, href }) => ({ label, href }));
  }, [location.pathname, t]);
}
