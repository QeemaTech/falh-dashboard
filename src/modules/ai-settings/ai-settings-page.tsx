import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Refresh, Save, SmartToy } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AppBadge, AppStatCard } from "../../components/design-system";
import { EmptyState } from "../../components/layout";
import { toast } from "../../components/ui/sonner";
import { fetchAiSettingsApi, updateAiSettingsApi } from "../../services/admin-api";
import { getApiErrorMessage } from "../../utils/api-error";
import { useI18n } from "../../hooks/use-i18n";
import {
  DEFAULT_AI_SETTINGS,
  normalizeAiSettings,
  type AiSettings,
} from "../../types/ai";

function settingsToForm(settings: AiSettings): AiSettings {
  return normalizeAiSettings(settings);
}

export function AiSettingsPage() {
  const { t, isArabic } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AiSettings>(() => settingsToForm(DEFAULT_AI_SETTINGS));
  const [dailyLimitInput, setDailyLimitInput] = useState<string>(() => String(DEFAULT_AI_SETTINGS.dailyLimitPerUser));
  const [dirty, setDirty] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["ai-settings"],
    queryFn: fetchAiSettingsApi,
    retry: 1,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    const normalized = settingsToForm(settingsQuery.data);
    setForm(normalized);
    setDailyLimitInput(String(normalized.dailyLimitPerUser));
    setDirty(false);
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const parsed = Number.parseInt(dailyLimitInput, 10);
      const finalLimit = Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
      return updateAiSettingsApi({
        systemPrompt: form.systemPrompt,
        dailyLimitPerUser: finalLimit,
      });
    },
    onSuccess: (saved) => {
      queryClient.setQueryData(["ai-settings"], saved);
      const normalized = settingsToForm(saved);
      setForm(normalized);
      setDailyLimitInput(String(normalized.dailyLimitPerUser));
      setDirty(false);
      toast.success(t("ai.saved"));
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, t("ai.saveFailed"))),
  });

  function patchForm(next: Partial<AiSettings>) {
    setForm((prev) => settingsToForm({ ...prev, ...next }));
    setDirty(true);
  }

  if (settingsQuery.isPending && !settingsQuery.data) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (settingsQuery.isError && !settingsQuery.data) {
    return (
      <EmptyState
        title={t("ai.loadFailed")}
        description={`${getApiErrorMessage(settingsQuery.error)}. ${t("ai.loadFailedHint")}`}
        action={
          <Button variant="outlined" startIcon={<Refresh />} onClick={() => settingsQuery.refetch()}>
            {t("ai.tryAgain")}
          </Button>
        }
      />
    );
  }

  const updatedLabel = form.updatedAt
    ? new Date(form.updatedAt).toLocaleString(isArabic ? "ar-EG" : "en-US")
    : t("ai.notSavedYet");

  return (
    <Stack spacing={3}>
      <Paper
        sx={{
          p: 3,
          color: "primary.contrastText",
          background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
        }}
      >
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("ai.title")}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
              {t("ai.subtitle")}
            </Typography>
          </Box>
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Button
              variant="outlined"
              size="small"
              startIcon={settingsQuery.isFetching ? <CircularProgress size={16} color="inherit" /> : <Refresh />}
              onClick={() => settingsQuery.refetch()}
              disabled={settingsQuery.isFetching}
              sx={{ color: "inherit", borderColor: "rgba(255,255,255,0.4)" }}
            >
              {t("ai.refresh")}
            </Button>
            <SmartToy sx={{ fontSize: 40, opacity: 0.8 }} />
          </Stack>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AppStatCard title={t("ai.dailyLimitPerUser")} value={dailyLimitInput || "10"} trend="neutral" />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <AppStatCard title={isArabic ? "مزود الذكاء الاصطناعي" : "AI Engine"} value="Google Gemini" />
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Stack spacing={3}>
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, pb: 2, borderBottom: 1, borderColor: "divider" }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {t("ai.configTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("ai.lastUpdated")}: {updatedLabel}
              </Typography>
            </Box>
            {dirty ? <AppBadge variant="warning">{t("ai.unsavedChanges")}</AppBadge> : null}
          </Stack>

          <TextField
            type="number"
            fullWidth
            size="small"
            label={t("ai.dailyLimitPerUser")}
            value={dailyLimitInput}
            onChange={(event) => {
              const val = event.target.value;
              setDailyLimitInput(val);
              const parsed = Number.parseInt(val, 10);
              const finalLimit = Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
              setForm((prev) => ({ ...prev, dailyLimitPerUser: finalLimit }));
              setDirty(true);
            }}
            helperText={t("ai.dailyLimitPerUserHint")}
            slotProps={{ htmlInput: { min: 1, max: 1000 } }}
          />

          <TextField
            multiline
            minRows={14}
            fullWidth
            label={t("ai.systemPrompt")}
            value={form.systemPrompt}
            onChange={(event) => patchForm({ systemPrompt: event.target.value })}
            helperText={t("ai.systemPromptHint")}
            slotProps={{ htmlInput: { dir: "auto" } }}
          />

          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", pt: 1, borderTop: 1, borderColor: "divider" }}>
            <Button
              variant="outlined"
              onClick={() => {
                const currentData = settingsQuery.data ? settingsToForm(settingsQuery.data) : settingsToForm(DEFAULT_AI_SETTINGS);
                setForm(currentData);
                setDailyLimitInput(String(currentData.dailyLimitPerUser));
                setDirty(false);
              }}
              disabled={!dirty || saveMutation.isPending}
            >
              {t("ai.reset")}
            </Button>
            <Button
              variant="contained"
              startIcon={saveMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <Save />}
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
            >
              {t("ai.save")}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
