import type { MarketItem, MarketTrend } from "../../types/market";

const LIVESTOCK_NAME_KEYS: Record<string, string> = {
  عجول: "market.livestock.calves",
  ضأن: "market.livestock.sheep",
  دواجن: "market.livestock.poultryBirds",
};

const CATEGORY_KEYS: Record<string, string> = {
  "لحوم حية": "market.category.liveMeat",
  "فراخ بيضاء": "market.category.whiteChicken",
};

const SOURCE_KEYS: Record<string, string> = {
  SEED: "market.source.seed",
  AI: "market.source.ai",
  GEMINI: "market.source.gemini",
  MANUAL: "market.source.manual",
};

export function trendBadgeVariant(trend: MarketTrend) {
  if (trend === "up") return "success" as const;
  if (trend === "down") return "danger" as const;
  return "neutral" as const;
}

export function displayItemName(item: MarketItem, isArabic: boolean, t: (key: string) => string) {
  if (item.nameAr && item.nameEn && item.nameAr !== item.nameEn) {
    return isArabic ? item.nameAr : item.nameEn;
  }

  const mappedKey = LIVESTOCK_NAME_KEYS[item.name];
  if (mappedKey) return t(mappedKey);

  return item.name;
}

export function displaySourceLabel(source: string | undefined, t: (key: string) => string) {
  if (!source) return "-";
  const normalized = source.trim();
  const categoryKey = CATEGORY_KEYS[normalized];
  if (categoryKey) return t(categoryKey);
  const sourceKey = SOURCE_KEYS[normalized.toUpperCase()];
  if (sourceKey) return t(sourceKey);
  return normalized;
}

export function formatMarketPrice(
  price: number,
  unit: string,
  t: (key: string) => string,
  locale: string
) {
  const currency = t("market.currency");
  const unitLabel = unit === "كجم" ? t("market.unit.kg") : unit;
  return `${currency} ${Number(price).toLocaleString(locale)} / ${unitLabel}`;
}

export function filterMarketItems(items: MarketItem[], search: string, trend: "" | MarketTrend) {
  const query = search.trim().toLowerCase();
  return items.filter((item) => {
    if (trend && item.trend !== trend) return false;
    if (!query) return true;
    const haystack = [item.name, item.nameAr, item.nameEn, item.source]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(query);
  });
}

export function marketStats(items: MarketItem[]) {
  return {
    total: items.length,
    up: items.filter((item) => item.trend === "up").length,
    down: items.filter((item) => item.trend === "down").length,
    stable: items.filter((item) => item.trend === "stable").length,
  };
}
