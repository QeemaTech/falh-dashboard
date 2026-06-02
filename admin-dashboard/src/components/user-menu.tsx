import { ChevronDown, LogOut, Moon, Sun, Languages } from "lucide-react";
import { useState } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useUiStore } from "../store/ui-store";
import { useAuth } from "../store/auth-store";
import { AppAvatar } from "./design-system";
import { useI18n } from "../hooks/use-i18n";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useUiStore();
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const name = user?.name || "Admin User";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="flex items-center gap-3 rounded-[14px] border border-(--app-border) bg-(--app-surface) px-3 py-2 shadow-(--app-shadow-soft) transition hover:border-[#23673A]/30 hover:shadow-[0_12px_26px_-16px_rgba(35,103,58,0.55)]"
      >
        <AppAvatar name={name} className="size-9" />
        <div className="hidden text-start sm:block">
          <p className="text-sm font-semibold text-(--app-text-primary)">{name}</p>
          <p className="text-xs text-(--app-text-secondary)">{t("menu.superAdmin")}</p>
        </div>
        <ChevronDown className="size-4 text-neutral-500" />
      </button>

      {open ? (
        <div className="absolute inset-e-0 z-30 mt-2 w-56 rounded-[20px] border border-(--app-border) bg-(--app-surface) p-2 shadow-(--app-shadow-soft)">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => {
              setTheme(theme === "dark" ? "light" : "dark");
              setOpen(false);
            }}
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === "dark" ? t("menu.lightMode") : t("menu.darkMode")}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start"
            disabled
          >
            <Languages className="size-4" />
            {t("menu.language")}
          </Button>
          <div className="grid grid-cols-2 gap-2 px-1 pb-1">
            <Button
              variant={language === "ar" ? "default" : "outline"}
              className="w-full"
              onClick={() => {
                setLanguage("ar");
                setOpen(false);
              }}
            >
              {t("menu.arabic")}
            </Button>
            <Button
              variant={language === "en" ? "default" : "outline"}
              className="w-full"
              onClick={() => {
                setLanguage("en");
                setOpen(false);
              }}
            >
              {t("menu.english")}
            </Button>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:bg-red-50 hover:text-red-700"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
          >
            <LogOut className="size-4" />
            {t("common.logout")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
