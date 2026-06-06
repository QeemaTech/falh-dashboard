export type MarketTrend = "up" | "down" | "stable";

export interface MarketPagination {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface MarketItem {
  id: string;
  name: string;
  nameAr?: string;
  nameEn?: string;
  cropName?: string;
  category?: string;
  price: number;
  unit: string;
  trend: MarketTrend;
  source?: string;
  recordedAt: string;
}

export interface LatestMarketData {
  crops: MarketItem[];
  poultry: MarketItem[];
  livestock: MarketItem[];
}

export type LivestockCategory = "livestock" | "poultry";
