import {
  Bot,
  Bell,
  Boxes,
  Building2,
  Leaf,
  LayoutDashboard,
  Megaphone,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Sun,
  Users,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "../utils/cn";
import { useUiStore } from "../store/ui-store";
import { useI18n } from "../hooks/use-i18n";

const sections = [
  {
    titleKey: "nav.section.dashboard",
    items: [{ to: "/", labelKey: "nav.dashboard", icon: LayoutDashboard }],
  },
  {
    titleKey: "nav.section.management",
    items: [
      { to: "/users", labelKey: "nav.users", icon: Users },
      { to: "/companies", labelKey: "nav.companies", icon: Building2 },
      { to: "/company-applications", labelKey: "nav.companyApplications", icon: Building2 },
      { to: "/products", labelKey: "nav.products", icon: Boxes },
      { to: "/pending-products", labelKey: "nav.pendingProducts", icon: Boxes },
      { to: "/categories", labelKey: "nav.categories", icon: Leaf },
      { to: "/orders", labelKey: "nav.orders", icon: ShoppingCart },
    ],
  },
  {
    titleKey: "nav.section.content",
    items: [
      { to: "/banners", labelKey: "nav.banners", icon: Megaphone },
      { to: "/notifications", labelKey: "nav.notifications", icon: Bell },
    ],
  },
  {
    titleKey: "nav.section.services",
    items: [
      { to: "/consultants", labelKey: "nav.consultants", icon: Users },
      { to: "/ai-settings", labelKey: "nav.aiSettings", icon: Bot },
      { to: "/crop-prices", labelKey: "nav.cropPrices", icon: Leaf },
      { to: "/weather-settings", labelKey: "nav.weatherSettings", icon: Sun },
    ],
  },
  {
    titleKey: "nav.section.system",
    items: [
      { to: "/system-settings", labelKey: "nav.systemSettings", icon: Settings },
      { to: "/roles-permissions", labelKey: "nav.rolesPermissions", icon: ShieldCheck },
    ],
  },
];

export function Sidebar() {
  const { sidebarOpen } = useUiStore();
  const { t } = useI18n();

  return (
    <aside
      className={cn(
        "sticky top-3 hidden h-[calc(100vh-1.5rem)] rounded-[30px] border border-(--app-border) bg-(--app-sidebar-bg) p-3 shadow-(--app-shadow-soft) transition-all duration-300 lg:mx-3 lg:block",
        sidebarOpen ? "w-72" : "w-24"
      )}
    >
      <div className={cn("mb-4 flex items-center rounded-2xl bg-[#23673A]/8 p-3", sidebarOpen ? "gap-3" : "justify-center")}>
        <div className="flex size-10 items-center justify-center rounded-xl bg-[#23673A] text-sm font-bold text-white">F</div>
        {sidebarOpen ? (
          <div>
            <p className="text-sm font-semibold text-[#23673A]">{t("brand.name")}</p>
            <p className="text-xs text-(--app-text-secondary)">{t("brand.tagline")}</p>
          </div>
        ) : null}
      </div>
      <nav className="h-[calc(100vh-9.5rem)] space-y-4 overflow-auto pe-1">
        {sections.map((section) => (
          <section key={section.titleKey}>
            {sidebarOpen ? (
              <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-(--app-text-secondary)">
                {t(section.titleKey)}
              </p>
            ) : null}
            <div className="space-y-1">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      "group relative flex items-center rounded-[16px] px-3 py-2.5 text-sm font-medium text-(--app-text-secondary) transition-all duration-200 hover:-translate-y-px hover:bg-(--app-hover) hover:text-(--app-text-primary)",
                      sidebarOpen ? "gap-3" : "justify-center",
                      isActive &&
                        "bg-[#23673A]/12 text-[#23673A] shadow-[0_16px_30px_-24px_rgba(35,103,58,0.7)]"
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={cn(
                          "absolute inset-y-2 inset-s-1 w-1 rounded-full bg-[#23673A] transition-opacity",
                          isActive ? "opacity-100" : "opacity-0"
                        )}
                      />
                      <item.icon className={cn("size-4 shrink-0 transition-transform duration-200 group-hover:scale-105", isActive && "text-[#23673A]")} />
                      {sidebarOpen ? <span className="truncate">{t(item.labelKey)}</span> : null}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </section>
        ))}
      </nav>
    </aside>
  );
}
