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
  isRain?: boolean;
  isStorm?: boolean;
};

export type WeatherForecastResult = {
  location?: WeatherLocationMeta;
  unit?: string;
  days: WeatherForecastDay[];
  nextThreeDays?: unknown[];
  cache?: { hit: boolean; ttlMinutes?: number };
};

export async function fetchWeatherForecastApi(params: WeatherQueryParams = {}) {
  const { data } = await http.get<ApiResponse<WeatherForecastResult>>("/weather/forecast", {
    params: buildParams(params),
  });
  return data.data;
}
