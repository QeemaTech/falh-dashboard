import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
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
        <main className="min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-3 sm:p-4 lg:p-6">
          <div className="mx-auto w-full min-w-0 space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
