import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";

type Direction = "rtl" | "ltr";
type Language = "ar" | "en";

type UiContextValue = {
  direction: Direction;
  language: Language;
  setLanguage: (language: Language) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
};

const UiContext = createContext<UiContextValue | null>(null);

export function UiProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "ar";
    const stored = window.localStorage.getItem("app-language");
    return stored === "en" ? "en" : "ar";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const direction: Direction = language === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = language;
      document.documentElement.dir = direction;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("app-language", language);
    }
  }, [direction, language]);

  const value = useMemo(
    () => ({ direction, language, setLanguage, sidebarOpen, setSidebarOpen }),
    [direction, language, sidebarOpen]
  );
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUiStore() {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error("useUiStore must be used within UiProvider");
  return ctx;
}
