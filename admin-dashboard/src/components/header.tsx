import { Bell, Menu } from "lucide-react";
import { useState } from "react";
import { SearchBar } from "./search-bar";
import { UserMenu } from "./user-menu";
import { useGlobalSearch } from "../hooks/use-global-search";
import { Button } from "./ui/button";
import { useUiStore } from "../store/ui-store";
import { Breadcrumbs } from "./breadcrumbs";
import { useI18n } from "../hooks/use-i18n";

export function Header() {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { search, setSearch } = useGlobalSearch();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const { t } = useI18n();
  const notifications = [
    t("header.notification.pendingProducts"),
    t("header.notification.newOrders"),
    t("header.notification.serverHealth"),
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-(--app-border) bg-(--app-header-bg)/95 px-3 py-3 backdrop-blur-xl sm:px-4 lg:px-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-3">
          <Button variant="ghost" onClick={() => setSidebarOpen(!sidebarOpen)} className="h-11 w-11 p-0">
            <Menu className="size-4" />
          </Button>
          <SearchBar value={search} onChange={setSearch} />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Button
              variant="outline"
              className="relative h-11 w-11 p-0"
              onClick={() => setNotificationsOpen((current) => !current)}
            >
              <Bell className="size-4" />
              <span className="absolute inset-e-2 top-2 size-2 rounded-full bg-[#23673A]" />
            </Button>
            {notificationsOpen ? (
              <div className="absolute inset-e-0 z-30 mt-2 w-80 rounded-[20px] border border-(--app-border) bg-(--app-surface) p-2 shadow-(--app-shadow-soft)">
                <p className="px-2 pb-2 text-xs font-semibold uppercase tracking-wider text-(--app-text-secondary)">{t("common.notifications")}</p>
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification}
                      className="rounded-[14px] px-3 py-2 text-sm text-(--app-text-primary) transition hover:bg-(--app-hover)"
                    >
                      {notification}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <UserMenu />
        </div>
      </div>
      <Breadcrumbs />
    </header>
  );
}
