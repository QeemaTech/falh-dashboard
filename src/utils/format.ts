type Language = "ar" | "en";

export function localeFor(language: Language) {
  return language === "ar" ? "ar-EG" : "en-US";
}

/** Formats a numeric amount with locale-correct grouping and digits, prefixed with the given currency label. */
export function formatCurrency(value: number | null | undefined, language: Language, currencyLabel: string) {
  const amount = Number(value ?? 0);
  return `${currencyLabel} ${amount.toLocaleString(localeFor(language))}`;
}

export function formatNumber(value: number | null | undefined, language: Language) {
  return Number(value ?? 0).toLocaleString(localeFor(language));
}

export function formatDate(value: string | number | Date | null | undefined, language: Language) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString(localeFor(language));
}

export function formatDateTime(value: string | number | Date | null | undefined, language: Language) {
  if (!value) return "-";
  return new Date(value).toLocaleString(localeFor(language));
}
