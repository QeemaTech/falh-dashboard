import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Refresh, Save, SmartToy } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Paper,
  Slider,
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
  GEMINI_MODELS,
  normalizeAiSettings,
  OPENAI_MODELS,
  type AiProvider,
  type AiSettings,
} from "../../types/ai";

function settingsToForm(settings: AiSettings): AiSettings {
  return normalizeAiSettings(settings);
}

export function AiSettingsPage() {
  const { t, isArabic } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AiSettings>(() => settingsToForm(DEFAULT_AI_SETTINGS));
  const [dirty, setDirty] = useState(false);

  const settingsQuery = useQuery({
    queryKey: ["ai-settings"],
    queryFn: fetchAiSettingsApi,
    retry: 1,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    setForm(settingsToForm(settingsQuery.data));
    setDirty(false);
  }, [settingsQuery.data]);

  const modelOptions = useMemo(() => {
    return form.provider === "gemini" ? [...GEMINI_MODELS] : [...OPENAI_MODELS];
  }, [form.provider]);

  const saveMutation = useMutation({
    mutationFn: () =>
      updateAiSettingsApi({
        provider: form.provider,
        model: form.model,
        systemPrompt: form.systemPrompt,
        temperature: form.temperature,
        maxTokens: form.maxTokens,
      }),
    onSuccess: (saved) => {
      queryClient.setQueryData(["ai-settings"], saved);
      setForm(settingsToForm(saved));
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
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}>
          <AppStatCard title={t("ai.provider")} value={form.provider === "gemini" ? t("ai.provider.gemini") : t("ai.provider.openai")} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><AppStatCard title={t("ai.model")} value={form.model} /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><AppStatCard title={t("ai.temperature")} value={form.temperature.toFixed(1)} trend="neutral" /></Grid>
        <Grid size={{ xs: 12, sm: 6, xl: 3 }}><AppStatCard title={t("ai.maxTokens")} value={form.maxTokens} trend="neutral" /></Grid>
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

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, lg: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={t("ai.provider")}
                value={form.provider}
                onChange={(event) => {
                  const provider = event.target.value as AiProvider;
                  const defaultModel = provider === "gemini" ? GEMINI_MODELS[0] : OPENAI_MODELS[0];
                  patchForm({ provider, model: defaultModel });
                }}
              >
                <MenuItem value="openai">{t("ai.provider.openai")}</MenuItem>
                <MenuItem value="gemini">{t("ai.provider.gemini")}</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
              <TextField
                select
                fullWidth
                size="small"
                label={t("ai.model")}
                value={form.model}
                onChange={(event) => patchForm({ model: event.target.value })}
              >
                {modelOptions.map((model) => (
                  <MenuItem key={model} value={model}>
                    {model}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

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

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                {t("ai.temperature")} ({form.temperature.toFixed(1)})
              </Typography>
              <Slider
                min={0}
                max={2}
                step={0.1}
                value={form.temperature}
                onChange={(_, value) => patchForm({ temperature: value as number })}
                color="primary"
              />
              <Typography variant="caption" color="text.secondary">
                {t("ai.temperatureHint")}
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                type="number"
                fullWidth
                size="small"
                label={t("ai.maxTokens")}
                value={form.maxTokens}
                onChange={(event) => patchForm({ maxTokens: Number(event.target.value) || 2048 })}
                helperText={t("ai.maxTokensHint")}
                slotProps={{ htmlInput: { min: 256, max: 8192 } }}
              />
            </Grid>
          </Grid>

          <Paper variant="outlined" sx={{ p: 2, bgcolor: "action.hover" }}>
            <Typography variant="caption" color="text.secondary">
              {t("ai.mobileApiHint")}
            </Typography>
          </Paper>

          <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", pt: 1, borderTop: 1, borderColor: "divider" }}>
            <Button
              variant="outlined"
              onClick={() => {
                if (settingsQuery.data) setForm(settingsToForm(settingsQuery.data));
                else setForm(settingsToForm(DEFAULT_AI_SETTINGS));
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
