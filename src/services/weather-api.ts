import { resolveAssetUrl } from "../utils/asset-url";
import { http } from "./http";

type ApiResponse<T> = { success: boolean; data: T; message?: string };

export type NormalizedWeather = {
  temp: number | null;
  condition: string;
  windSpeed: number;
  humidity: number | null;
  isRain: boolean;
  isStorm: boolean;
  city: string | null;
};

export type WeatherLocationMeta = {
  source: "coordinates" | "city" | "defaultCity";
  city: string | null;
  lat: number | null;
  lon: number | null;
};

export type WeatherQueryParams = {
  lat?: number;
  lng?: number;
  lon?: number;
  city?: string;
  units?: "metric" | "imperial";
  locale?: "ar" | "en";
};

function buildParams(params: WeatherQueryParams) {
  const query: Record<string, string | number> = {};
  if (params.lat !== undefined) query.lat = params.lat;
  const lon = params.lng ?? params.lon;
  if (lon !== undefined) query.lng = lon;
  if (params.city) query.city = params.city;
  if (params.units) query.units = params.units;
  if (params.locale) query.locale = params.locale;
  return query;
}

export type WeatherAlertResult = {
  alert: boolean;
  type: string | null;
  alerts: Array<{ type: string; message: string }>;
  weather: NormalizedWeather;
  location?: WeatherLocationMeta;
};

export async function fetchCurrentWeatherApi(params: WeatherQueryParams = {}) {
  const { data } = await http.get<
    ApiResponse<{ weather: NormalizedWeather; location?: WeatherLocationMeta; cache?: { hit: boolean } }>
  >("/weather/current", { params: buildParams(params) });
  return data.data;
}

export async function fetchWeatherAlertsApi(params: WeatherQueryParams = {}) {
  const { data } = await http.get<ApiResponse<WeatherAlertResult>>("/weather/check-alerts", {
    params: buildParams(params),
  });
  return data.data;
}

export type WeatherForecastDay = {
  date: string;
  dayName: string;
  tempMax: number;
  tempMin: number;
  condition: string;
  conditionCode?: string | null;
  icon?: string | null;
  iconUrl?: string | null;
  isRain?: boolean;
  isStorm?: boolean;
};

/** PNG from Falh `/api/weather/icons/:code` — never OpenWeatherMap. */
export function resolveWeatherIconUrl(icon?: string | null, iconUrl?: string | null) {
  const blocked = /openweathermap\.org|%7Bicon%7D|\{icon\}/i;
  if (iconUrl && !blocked.test(iconUrl)) return resolveAssetUrl(iconUrl);
  const code = String(icon || "").trim();
  if (/^\d{2}[dn]$/i.test(code)) return resolveAssetUrl(`/api/weather/icons/${code.toLowerCase()}`);
  return resolveAssetUrl("/api/weather/icons/01d");
}

type ForecastConditionObj = {
  text?: string;
  icon?: string;
  iconUrl?: string;
  code?: number | string;
};

type ForecastDayPayload = Omit<WeatherForecastDay, "condition" | "dayName" | "tempMax" | "tempMin"> & {
  dayName?: string;
  weekday?: string;
  tempMax?: number | null;
  tempMin?: number | null;
  tempMaxC?: number | null;
  tempMinC?: number | null;
  conditionText?: string;
  condition?: string | ForecastConditionObj;
};

function mapForecastDay(raw: ForecastDayPayload): WeatherForecastDay {
  const conditionObj =
    raw.condition && typeof raw.condition === "object" ? (raw.condition as ForecastConditionObj) : null;
  const icon = raw.icon || conditionObj?.icon || null;
  const iconUrl = raw.iconUrl || conditionObj?.iconUrl || null;
  const conditionText =
    conditionObj?.text ||
    raw.conditionText ||
    (typeof raw.condition === "string" ? raw.condition : "");
  return {
    date: raw.date,
    dayName: raw.dayName || raw.weekday || raw.date,
    tempMax: Number(raw.tempMax ?? raw.tempMaxC ?? 0),
    tempMin: Number(raw.tempMin ?? raw.tempMinC ?? 0),
    condition: conditionText,
    conditionCode:
      raw.conditionCode != null
        ? String(raw.conditionCode)
        : conditionObj?.code != null
          ? String(conditionObj.code)
          : null,
    icon,
    iconUrl,
    isRain: raw.isRain,
    isStorm: raw.isStorm,
  };
}

export type WeatherForecastResult = {
  location?: WeatherLocationMeta;
  unit?: string;
  days: WeatherForecastDay[];
  nextThreeDays?: unknown[];
  cache?: { hit: boolean; ttlMinutes?: number };
};

export async function fetchWeatherForecastApi(params: WeatherQueryParams = {}) {
  const { data } = await http.get<ApiResponse<WeatherForecastResult & { days: ForecastDayPayload[] }>>(
    "/weather/forecast",
    { params: buildParams(params) }
  );
  const payload = data.data;
  return {
    ...payload,
    days: (payload.days || []).map(mapForecastDay),
  };
}
