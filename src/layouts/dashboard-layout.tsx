import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { NotificationCenter } from "../components/notification-center";
import { useUiStore } from "../store/ui-store";
import { cn } from "../utils/cn";

export function DashboardLayout() {
  const { direction, sidebarOpen } = useUiStore();

  return (
    <div dir={direction} className="min-h-screen overflow-x-hidden bg-(--app-background)">
      <Sidebar />
      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-col transition-[margin] duration-300",
          sidebarOpen ? "lg:ms-[19.5rem]" : "lg:ms-[7.5rem]"
        )}
      >
        <Header />
        <main className="grid min-h-0 flex-1 gap-6 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,280px)] lg:p-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,330px)]">
          <section className="min-w-0 space-y-6">
            <Outlet />
          </section>
          <section className="hidden min-w-0 lg:block">
            <div className="sticky top-24">
              <NotificationCenter />
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
