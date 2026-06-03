import { useMemo } from "react";
import { useUiStore } from "../store/ui-store";
import { translate } from "../i18n/translations";

export function useI18n() {
  const { language } = useUiStore();

  return useMemo(
    () => ({
      language,
      isArabic: language === "ar",
      t: (key: string, fallback?: string) => translate(language, key, fallback),
    }),
    [language]
  );
}
