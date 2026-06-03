import { Outlet } from "react-router-dom";
import { Button } from "../components/ui/button";
import { useAuth } from "../store/auth-store";
import { useNavigate } from "react-router-dom";

export function CompanyLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-(--app-background)">
      <header className="flex items-center justify-between border-b border-(--app-border) px-6 py-4">
        <div>
          <p className="text-sm font-semibold text-[#23673A]">Falh Company Portal</p>
          <p className="text-xs text-neutral-500">{user?.name}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          Sign out
        </Button>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <Outlet />
      </main>
    </div>
  );
}
