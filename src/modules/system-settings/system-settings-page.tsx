import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ContactMail,
  Image,
  Language,
  Public,
  Save,
  Settings,
} from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Divider,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { EmptyState, PageHeader } from "../../components/layout";
import { toast } from "../../components/ui/sonner";
import { BRANDING_QUERY_KEY } from "../../hooks/use-branding";
import { useI18n } from "../../hooks/use-i18n";
import {
  fetchSystemSettings,
  updateSystemSettingsApi,
  uploadSystemAssetsApi,
  type SystemSettings,
} from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";

type AssetKey = "logo";

const initialSettings: SystemSettings = {
  general: { projectName: "", logo: "", favicon: "", footerText: "" },
  contact: { phone: "", email: "", whatsapp: "", address: "" },
  social: { facebook: "", instagram: "", x: "", tiktok: "", youtube: "" },
  application: {
    currency: "EGP",
    language: "ar",
    timezone: "Africa/Cairo",
    splashScreen: "",
    appIcon: "",
    loginBackground: "",
  },
};

type SettingsSectionProps = {
  title: string;
  icon: ReactNode;
  children: ReactNode;
};

function SettingsSection({ title, icon, children }: SettingsSectionProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: { xs: 2, sm: 3 },
        height: "100%",
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
      }}
    >
      <Stack direction="row" spacing={1} sx={{ mb: 2, alignItems: "center" }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 1.5,
            display: "grid",
            placeItems: "center",
            bgcolor: "primary.main",
            color: "primary.contrastText",
          }}
        >
          {icon}
        </Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Stack>
      {children}
    </Paper>
  );
}

type AssetUploadCardProps = {
  label: string;
  previewUrl: string;
  onPick: (file: File) => void;
  chooseFileLabel: string;
};

function AssetUploadCard({ label, previewUrl, onPick, chooseFileLabel }: AssetUploadCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          flex: 1,
          minHeight: 100,
          display: "grid",
          placeItems: "center",
          bgcolor: "action.hover",
          borderRadius: 1.5,
          overflow: "hidden",
          mb: 1,
          border: "1px dashed",
          borderColor: previewUrl ? "transparent" : "divider",
        }}
      >
        {previewUrl ? (
          <Box
            component="img"
            src={previewUrl}
            alt={label}
            sx={{ width: "100%", height: "100%", objectFit: "contain", p: 0.5 }}
          />
        ) : (
          <Image color="disabled" />
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.75, fontWeight: 600 }}>
        {label}
      </Typography>
      <Button component="label" variant="outlined" size="small" fullWidth>
        {chooseFileLabel}
        <input
          hidden
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onPick(file);
            e.target.value = "";
          }}
        />
      </Button>
    </Paper>
  );
}

export function SystemSettingsPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<SystemSettings>(initialSettings);
  const [files, setFiles] = useState<Partial<Record<AssetKey, File>>>({});

  const settingsQuery = useQuery({
    queryKey: ["system-settings"],
    queryFn: fetchSystemSettings,
  });

  useEffect(() => {
    if (settingsQuery.data) setForm(settingsQuery.data);
  }, [settingsQuery.data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      let base = form;
      if (Object.keys(files).length > 0) {
        base = await uploadSystemAssetsApi(files);
      }
      return updateSystemSettingsApi({
        general: {
          ...base.general,
          projectName: form.general.projectName,
          footerText: form.general.footerText,
        },
        contact: form.contact,
        social: form.social,
        application: {
          ...base.application,
          currency: form.application.currency,
          language: form.application.language,
          timezone: form.application.timezone,
        },
      });
    },
    onSuccess: (saved) => {
      setForm(saved);
      setFiles({});
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      queryClient.invalidateQueries({ queryKey: BRANDING_QUERY_KEY });
      toast.success(t("systemSettings.saved"));
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : t("systemSettings.saveFailed")),
  });

  const logoPreview = useMemo(
    () => (files.logo ? URL.createObjectURL(files.logo) : resolveAssetUrl(form.general.logo)),
    [files.logo, form.general.logo]
  );

  const setValue = (section: keyof SystemSettings, key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const hasPendingFiles = Object.keys(files).length > 0;
  const isSaving = saveMutation.isPending;

  if (settingsQuery.isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (settingsQuery.isError) {
    return (
      <EmptyState
        title={t("systemSettings.loadFailed")}
        description={(settingsQuery.error as Error).message}
      />
    );
  }

  return (
    <Stack spacing={3} sx={{ pb: 10 }}>
      <PageHeader
        title={t("systemSettings.title")}
        subtitle={t("systemSettings.subtitle")}
        icon={<Settings fontSize="small" />}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <SettingsSection title={t("systemSettings.general.title")} icon={<Settings sx={{ fontSize: 20 }} />}>
            <Stack spacing={2}>
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.general.projectName")}
                value={form.general.projectName}
                onChange={(e) => setValue("general", "projectName", e.target.value)}
              />
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.general.footerText")}
                value={form.general.footerText}
                onChange={(e) => setValue("general", "footerText", e.target.value)}
              />
              <Divider />
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                {t("systemSettings.general.logoHint")}
              </Typography>
              <AssetUploadCard
                label={t("systemSettings.assets.logo")}
                previewUrl={logoPreview}
                chooseFileLabel={t("systemSettings.chooseFile")}
                onPick={(file) => setFiles({ logo: file })}
              />
            </Stack>
          </SettingsSection>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SettingsSection title={t("systemSettings.contact.title")} icon={<ContactMail sx={{ fontSize: 20 }} />}>
            <Stack spacing={2}>
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.contact.phone")}
                value={form.contact.phone}
                onChange={(e) => setValue("contact", "phone", e.target.value)}
              />
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.contact.email")}
                value={form.contact.email}
                onChange={(e) => setValue("contact", "email", e.target.value)}
              />
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.contact.whatsapp")}
                value={form.contact.whatsapp}
                onChange={(e) => setValue("contact", "whatsapp", e.target.value)}
              />
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.contact.address")}
                value={form.contact.address}
                onChange={(e) => setValue("contact", "address", e.target.value)}
                multiline
                minRows={2}
              />
            </Stack>
          </SettingsSection>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SettingsSection title={t("systemSettings.social.title")} icon={<Public sx={{ fontSize: 20 }} />}>
            <Stack spacing={2}>
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.social.facebook")}
                value={form.social.facebook}
                onChange={(e) => setValue("social", "facebook", e.target.value)}
              />
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.social.instagram")}
                value={form.social.instagram}
                onChange={(e) => setValue("social", "instagram", e.target.value)}
              />
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.social.x")}
                value={form.social.x}
                onChange={(e) => setValue("social", "x", e.target.value)}
              />
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.social.tiktok")}
                value={form.social.tiktok}
                onChange={(e) => setValue("social", "tiktok", e.target.value)}
              />
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.social.youtube")}
                value={form.social.youtube}
                onChange={(e) => setValue("social", "youtube", e.target.value)}
              />
            </Stack>
          </SettingsSection>
        </Grid>

        <Grid size={{ xs: 12, lg: 6 }}>
          <SettingsSection title={t("systemSettings.application.title")} icon={<Language sx={{ fontSize: 20 }} />}>
            <Stack spacing={2}>
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.application.currency")}
                value={form.application.currency}
                onChange={(e) => setValue("application", "currency", e.target.value)}
              />
              <TextField
                select
                size="small"
                fullWidth
                label={t("systemSettings.application.language")}
                value={form.application.language}
                onChange={(e) => setValue("application", "language", e.target.value)}
              >
                <MenuItem value="ar">{t("systemSettings.application.langAr")}</MenuItem>
                <MenuItem value="en">{t("systemSettings.application.langEn")}</MenuItem>
              </TextField>
              <TextField
                size="small"
                fullWidth
                label={t("systemSettings.application.timezone")}
                value={form.application.timezone}
                onChange={(e) => setValue("application", "timezone", e.target.value)}
              />
            </Stack>
          </SettingsSection>
        </Grid>
      </Grid>

      <Paper
        elevation={4}
        sx={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.appBar,
          px: { xs: 2, md: 4 },
          py: 1.5,
          borderTop: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ alignItems: { sm: "center" }, justifyContent: "flex-end", maxWidth: 1400, mx: "auto" }}
        >
          {hasPendingFiles ? (
            <Typography variant="caption" color="warning.main" sx={{ mr: { sm: "auto" } }}>
              {t("systemSettings.pendingUploads")}
            </Typography>
          ) : (
            <Box sx={{ flex: 1, display: { xs: "none", sm: "block" } }} />
          )}
          <Button
            variant="contained"
            size="large"
            startIcon={isSaving ? <CircularProgress size={18} color="inherit" /> : <Save />}
            onClick={() => saveMutation.mutate()}
            disabled={isSaving}
          >
            {isSaving ? t("systemSettings.saving") : t("systemSettings.save")}
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
