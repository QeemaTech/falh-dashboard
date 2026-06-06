import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CloudQueue,
  LocationOn,
  Refresh,
  Save,
  Thermostat,
  Air,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { toast } from "../../components/ui/sonner";
import { WeatherForecastStrip } from "../../components/weather-forecast-strip";
import { EmptyState, PageSection } from "../../components/layout";
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
    return (
      <Paper sx={{ p: 3 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
          <CircularProgress size={24} />
          <Typography variant="body2" color="text.secondary">
            {t("common.loading")}
          </Typography>
        </Stack>
      </Paper>
    );
  }

  if (settingsQuery.isError) {
    return (
      <EmptyState
        title={t("weather.loadFailed")}
        description={getApiErrorMessage(settingsQuery.error)}
      />
    );
  }

  return (
    <Stack spacing={3} sx={{ minWidth: 0, overflowX: "hidden" }}>
      <PageSection
        title={t("weather.forecastTitle")}
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={forecastQuery.isFetching ? <CircularProgress size={16} /> : <Refresh />}
            onClick={() => {
              forecastQuery.refetch();
              alertsQuery.refetch();
            }}
            disabled={forecastQuery.isFetching}
          >
            {t("weather.refreshPreview")}
          </Button>
        }
      >
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {locationLabel}
          {forecastQuery.data?.location?.source
            ? ` · ${t(`weather.source.${forecastQuery.data.location.source}`)}`
            : null}
        </Typography>

        <WeatherForecastStrip
          days={forecastDays}
          loading={forecastQuery.isLoading}
          error={forecastQuery.isError ? getApiErrorMessage(forecastQuery.error, t("weather.previewFailed")) : null}
        />

        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
          {t("weather.forecastHint")}
        </Typography>
      </PageSection>

      {alertsQuery.data?.alert ? (
        <Alert
          severity="warning"
          icon={<CloudQueue fontSize="inherit" />}
          sx={{ alignItems: "flex-start" }}
        >
          <Typography variant="subtitle2" gutterBottom>
            {t("weather.alerts")}
          </Typography>
          <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2 }}>
            {alertsQuery.data.alerts.map((item) => (
              <Typography component="li" variant="body2" key={`${item.type}-${item.message}`}>
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {item.type}:
                </Box>{" "}
                {item.message}
              </Typography>
            ))}
          </Stack>
        </Alert>
      ) : null}

      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack spacing={3}>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
              {t("weather.adminSettings")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t("weather.subtitleAdmin")}
            </Typography>
          </Box>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: "primary.50", borderColor: "primary.light" }}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {t("weather.gpsNoteTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t("weather.gpsNoteBody")}
            </Typography>
          </Paper>

          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <LocationOn color="primary" fontSize="small" />
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {t("weather.defaultCity")}
              </Typography>
            </Stack>
            <TextField
              size="small"
              value={defaultCity}
              onChange={(e) => setDefaultCity(e.target.value)}
              placeholder="Cairo"
              fullWidth
            />
            <Typography variant="caption" color="text.secondary">
              {t("weather.defaultCityHint")}
            </Typography>
          </Stack>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: "action.hover" }}>
            <Typography variant="body2" sx={{ fontWeight: 600, mb: 2 }}>
              {t("weather.thresholds")}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Air sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                    {t("weather.windMax")}
                  </Typography>
                </Stack>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { min: 0 } }}
                  value={thresholds.windSpeedMax ?? ""}
                  onChange={(e) =>
                    setThresholds((prev) => ({ ...prev, windSpeedMax: Number(e.target.value) }))
                  }
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Thermostat sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                    {t("weather.tempMin")}
                  </Typography>
                </Stack>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={thresholds.tempMin ?? ""}
                  onChange={(e) => setThresholds((prev) => ({ ...prev, tempMin: Number(e.target.value) }))}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 0.5 }}>
                  <Thermostat sx={{ fontSize: 16 }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                    {t("weather.tempMax")}
                  </Typography>
                </Stack>
                <TextField
                  type="number"
                  size="small"
                  fullWidth
                  value={thresholds.tempMax ?? ""}
                  onChange={(e) => setThresholds((prev) => ({ ...prev, tempMax: Number(e.target.value) }))}
                />
              </Grid>
            </Grid>
          </Paper>

          <Button
            variant="contained"
            disabled={saveMutation.isPending}
            startIcon={saveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Save />}
            onClick={() => saveMutation.mutate()}
          >
            {t("weather.save")}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
