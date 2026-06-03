import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CloudRain, Loader2, MapPin, Save, Thermometer, Wind } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { toast } from "../../components/ui/sonner";
import { WeatherForecastStrip } from "../../components/weather-forecast-strip";
import {
  fetchWeatherSettingsApi,
  updateWeatherSettingsApi,
  type WeatherThresholds,
} from "../../services/admin-api";
import { fetchWeatherAlertsApi, fetchWeatherForecastApi, type WeatherForecastDay } from "../../services/weather-api";
import { getApiErrorMessage } from "../../utils/api-error";
import { useI18n } from "../../hooks/use-i18n";

const defaultThresholds: WeatherThresholds = {
  windSpeedMax: 15,
  tempMin: 0,
  tempMax: 42,
};

export function WeatherSettingsPage() {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [defaultCity, setDefaultCity] = useState("Cairo");
  const [thresholds, setThresholds] = useState<WeatherThresholds>(defaultThresholds);

  const settingsQuery = useQuery({
    queryKey: ["weather-settings"],
    queryFn: fetchWeatherSettingsApi,
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setDefaultCity(settingsQuery.data.defaultCity);
    setThresholds({ ...defaultThresholds, ...settingsQuery.data.thresholds });
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateWeatherSettingsApi({
        defaultCity: defaultCity.trim(),
        thresholds,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["weather-settings"] });
      queryClient.invalidateQueries({ queryKey: ["weather-forecast-preview"] });
      queryClient.invalidateQueries({ queryKey: ["weather-alerts-preview"] });
      toast.success(t("weather.saved"));
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, t("weather.saveFailed"))),
  });

  const forecastQuery = useQuery({
    queryKey: ["weather-forecast-preview", defaultCity, language],
    queryFn: () => fetchWeatherForecastApi({ city: defaultCity, locale: language }),
    enabled: Boolean(defaultCity.trim()) && Boolean(settingsQuery.data),
    retry: false,
  });

  const alertsQuery = useQuery({
    queryKey: ["weather-alerts-preview", defaultCity],
    queryFn: () => fetchWeatherAlertsApi({ city: defaultCity }),
    enabled: Boolean(defaultCity.trim()) && Boolean(settingsQuery.data),
    retry: false,
  });

  const forecastDays = (forecastQuery.data?.days || []) as WeatherForecastDay[];
  const locationLabel =
    forecastQuery.data?.location?.city || defaultCity || t("weather.defaultCity");

  if (settingsQuery.isLoading) {
    return <Card className="p-6 text-sm text-(--app-text-secondary)">{t("common.loading")}</Card>;
  }

  if (settingsQuery.isError) {
    return (
      <Card className="p-6 text-sm text-red-600">
        {t("weather.loadFailed")}: {getApiErrorMessage(settingsQuery.error)}
      </Card>
    );
  }

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <Card className="space-y-3 border-none bg-transparent p-0 shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-lg font-semibold text-(--app-text-primary)">{t("weather.forecastTitle")}</h2>
            <p className="text-sm text-(--app-text-secondary)">
              {locationLabel}
              {forecastQuery.data?.location?.source
                ? ` · ${t(`weather.source.${forecastQuery.data.location.source}`)}`
                : null}
            </p>
          </div>
          <Button
            variant="outline"
            className="h-9 px-3 text-xs"
            onClick={() => {
              forecastQuery.refetch();
              alertsQuery.refetch();
            }}
            disabled={forecastQuery.isFetching}
          >
            {forecastQuery.isFetching ? <Loader2 className="size-4 animate-spin" /> : t("weather.refreshPreview")}
          </Button>
        </div>

        <WeatherForecastStrip
          days={forecastDays}
          loading={forecastQuery.isLoading}
          error={forecastQuery.isError ? getApiErrorMessage(forecastQuery.error, t("weather.previewFailed")) : null}
        />

        <p className="px-1 text-xs text-(--app-text-secondary)">{t("weather.forecastHint")}</p>
      </Card>

      {alertsQuery.data?.alert ? (
        <Card className="border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-2">
            <CloudRain className="size-4 text-amber-700" />
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">{t("weather.alerts")}</p>
          </div>
          <ul className="mt-2 space-y-1 text-sm text-amber-800 dark:text-amber-200">
            {alertsQuery.data.alerts.map((item) => (
              <li key={`${item.type}-${item.message}`}>
                <span className="font-medium">{item.type}:</span> {item.message}
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <Card className="space-y-4 p-4 sm:p-6">
        <div>
          <h3 className="text-base font-semibold text-(--app-text-primary)">{t("weather.adminSettings")}</h3>
          <p className="mt-1 text-sm text-(--app-text-secondary)">{t("weather.subtitleAdmin")}</p>
        </div>

        <div className="rounded-2xl border border-[#23673A]/20 bg-[#23673A]/5 p-4 text-sm text-(--app-text-secondary)">
          <p className="font-medium text-(--app-text-primary)">{t("weather.gpsNoteTitle")}</p>
          <p className="mt-1">{t("weather.gpsNoteBody")}</p>
        </div>

        <div className="space-y-2">
          <label className="flex items-center gap-2 text-sm font-medium text-(--app-text-primary)">
            <MapPin className="size-4 text-[#23673A]" />
            {t("weather.defaultCity")}
          </label>
          <Input value={defaultCity} onChange={(e) => setDefaultCity(e.target.value)} placeholder="Cairo" />
          <p className="text-xs text-(--app-text-secondary)">{t("weather.defaultCityHint")}</p>
        </div>

        <div className="rounded-2xl border border-(--app-border) bg-(--app-surface-muted) p-4">
          <h3 className="mb-3 text-sm font-semibold text-(--app-text-primary)">{t("weather.thresholds")}</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-(--app-text-secondary)">
                <Wind className="size-3.5" />
                {t("weather.windMax")}
              </label>
              <Input
                type="number"
                min={0}
                value={thresholds.windSpeedMax ?? ""}
                onChange={(e) =>
                  setThresholds((prev) => ({ ...prev, windSpeedMax: Number(e.target.value) }))
                }
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-(--app-text-secondary)">
                <Thermometer className="size-3.5" />
                {t("weather.tempMin")}
              </label>
              <Input
                type="number"
                value={thresholds.tempMin ?? ""}
                onChange={(e) => setThresholds((prev) => ({ ...prev, tempMin: Number(e.target.value) }))}
              />
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-1 text-xs font-medium text-(--app-text-secondary)">
                <Thermometer className="size-3.5" />
                {t("weather.tempMax")}
              </label>
              <Input
                type="number"
                value={thresholds.tempMax ?? ""}
                onChange={(e) => setThresholds((prev) => ({ ...prev, tempMax: Number(e.target.value) }))}
              />
            </div>
          </div>
        </div>

        <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
          {saveMutation.isPending ? <Loader2 className="me-2 size-4 animate-spin" /> : <Save className="me-2 size-4" />}
          {t("weather.save")}
        </Button>
      </Card>
    </div>
  );
}
