import { useQuery } from "@tanstack/react-query";
import { Card } from "../../components/ui/card";
import { fetchSystemSettings } from "../../services/admin-api";

export function AiSettingsPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["ai-settings-view"],
    queryFn: fetchSystemSettings,
  });

  if (isLoading) return <Card>Loading AI settings...</Card>;
  if (isError) return <Card>Failed to load AI settings: {(error as Error).message}</Card>;
  if (!data) return <Card>No AI settings data available.</Card>;

  return (
    <Card>
      <h2 className="mb-3 text-lg font-semibold text-(--app-text-primary)">AI Assistant Settings</h2>
      <p className="mb-4 text-sm text-(--app-text-secondary)">
        This page is currently backed by system settings until a dedicated AI settings endpoint is introduced.
      </p>
      <div className="space-y-2 text-sm text-(--app-text-secondary)">
        <p>
          <span className="font-medium text-(--app-text-primary)">Language:</span> {data.application.language}
        </p>
        <p>
          <span className="font-medium text-(--app-text-primary)">Timezone:</span> {data.application.timezone}
        </p>
        <p>
          <span className="font-medium text-(--app-text-primary)">Currency:</span> {data.application.currency}
        </p>
      </div>
    </Card>
  );
}
