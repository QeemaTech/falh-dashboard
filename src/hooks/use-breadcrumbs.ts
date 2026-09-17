import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "./use-i18n";

const UUID_LIKE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NUMERIC_ID = /^\d+$/;

function isEntityId(chunk: string) {
  return UUID_LIKE.test(chunk) || NUMERIC_ID.test(chunk) || chunk.length > 20;
}

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
      onboarding: "nav.onboarding",
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
      "pending-products": "nav.pendingProducts",
      "join-requests": "nav.joinRequests",
      new: "common.new",
      edit: "common.edit",
    };
    const chunks = location.pathname.split("/").filter(Boolean);
    return chunks
      .map((chunk, index) => {
        let label: string;
        if (routeLabelMap[chunk]) {
          label = t(routeLabelMap[chunk], chunk === "new" ? "New" : chunk === "edit" ? "Edit" : chunk);
        } else if (isEntityId(chunk)) {
          label = t("common.details", "Details");
        } else {
          label = t("", decodeURIComponent(chunk).replace(/-/g, " "));
        }
        return {
          chunk,
          index,
          href: `/${chunks.slice(0, index + 1).join("/")}`,
          label,
        };
      })
      .filter((crumb) => !(isCompany && crumb.chunk === "company" && chunks.length > 1))
      .map(({ label, href }) => ({ label, href }));
  }, [location.pathname, t]);
}
