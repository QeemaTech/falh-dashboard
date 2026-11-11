type Language = "ar" | "en";

export function localeFor(language: Language) {
  return language === "ar" ? "ar-EG" : "en-US";
}

function finiteMoney(value: number | string | null | undefined) {
  if (value === undefined || value === null || value === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : null;
}

/** Formats a numeric amount with locale-correct grouping. Number is LTR-isolated so it stays visible next to Arabic ج.م */
export function formatCurrency(value: number | string | null | undefined, language: Language, currencyLabel: string) {
  const amount = finiteMoney(value) ?? 0;
  const formatted = amount.toLocaleString(localeFor(language), { maximumFractionDigits: 2 });
  return `${currencyLabel} \u2066${formatted}\u2069`;
}

export function sellingPriceOf(product?: { price?: number | string | null; discountPrice?: number | string | null } | null) {
  if (!product) return null;
  return finiteMoney(product.price ?? product.discountPrice);
}

export function formatProductPrice(
  product: { price?: number | string | null; discountPrice?: number | string | null } | null | undefined,
  language: Language,
  currencyLabel: string
) {
  const amount = sellingPriceOf(product);
  if (amount == null) return "—";
  return formatCurrency(amount, language, currencyLabel);
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
