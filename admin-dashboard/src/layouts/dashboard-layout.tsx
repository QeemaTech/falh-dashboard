import { Outlet } from "react-router-dom";
import { Sidebar } from "../components/sidebar";
import { Header } from "../components/header";
import { NotificationCenter } from "../components/notification-center";
import { useUiStore } from "../store/ui-store";

export function DashboardLayout() {
  const { direction } = useUiStore();
  return (
    <div
      dir={direction}
      className="flex min-h-screen bg-(--app-background)"
    >
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header />
        <main className="grid flex-1 gap-6 p-3 sm:p-4 lg:grid-cols-[1fr_330px] lg:p-6">
          <section className="space-y-6">
            <Outlet />
          </section>
          <section className="hidden lg:block">
            <NotificationCenter />
          </section>
        </main>
      </div>
    </div>
  );
}
