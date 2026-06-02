import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { fetchWeatherSettingsApi } from "../../services/admin-api";

export function WeatherSettingsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["weather-settings"],
    queryFn: fetchWeatherSettingsApi,
  });

  if (isLoading) return <Card>Loading weather settings...</Card>;
  if (isError) return <Card>Failed to load weather settings: {(error as Error).message}</Card>;
  if (!data) return <Card>No weather settings found.</Card>;

  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold text-(--app-text-primary)">Weather Settings</h2>
      <div className="space-y-2 text-sm text-(--app-text-secondary)">
        <p>
          <span className="font-medium text-(--app-text-primary)">Provider:</span> {data.provider}
        </p>
        <p>
          <span className="font-medium text-(--app-text-primary)">Default City:</span> {data.defaultCity}
        </p>
        <p>
          <span className="font-medium text-(--app-text-primary)">Units:</span> {data.units}
        </p>
      </div>
    </Card>
  );
}
