import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Save, Settings } from "@mui/icons-material";
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
import { EmptyState, PageHeader } from "../../components/layout";
import { toast } from "../../components/ui/sonner";
import {
  fetchSystemSettings,
  updateSystemSettingsApi,
  uploadSystemAssetsApi,
  type SystemSettings,
} from "../../services/admin-api";

type AssetKey = "logo" | "favicon" | "splashScreen" | "appIcon" | "loginBackground";

const baseApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const hostUrl = baseApiUrl.replace(/\/api\/?$/, "");

function toAbs(path?: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${hostUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

const initialSettings: SystemSettings = {
  general: { projectName: "", logo: "", favicon: "", footerText: "" },
  contact: { phone: "", email: "", whatsapp: "", address: "" },
  social: { facebook: "", instagram: "", x: "", tiktok: "", youtube: "" },
  application: { currency: "EGP", language: "ar", timezone: "Africa/Cairo", splashScreen: "", appIcon: "", loginBackground: "" },
};

export function SystemSettingsPage() {
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
    mutationFn: (payload: Partial<SystemSettings>) => updateSystemSettingsApi(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Settings saved");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to save settings"),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadSystemAssetsApi,
    onSuccess: () => {
      setFiles({});
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Assets uploaded");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Upload failed"),
  });

  const assetPreview = useMemo(
    () => ({
      logo: files.logo ? URL.createObjectURL(files.logo) : toAbs(form.general.logo),
      favicon: files.favicon ? URL.createObjectURL(files.favicon) : toAbs(form.general.favicon),
      splashScreen: files.splashScreen ? URL.createObjectURL(files.splashScreen) : toAbs(form.application.splashScreen),
      appIcon: files.appIcon ? URL.createObjectURL(files.appIcon) : toAbs(form.application.appIcon),
      loginBackground: files.loginBackground
        ? URL.createObjectURL(files.loginBackground)
        : toAbs(form.application.loginBackground),
    }),
    [files, form]
  );

  const setValue = (section: keyof SystemSettings, key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
  };

  const onSave = () => {
    saveMutation.mutate({
      general: form.general,
      contact: form.contact,
      social: form.social,
      application: form.application,
    });
  };

  const onUploadAssets = () => uploadMutation.mutate(files);
  const isSaving = saveMutation.isPending || uploadMutation.isPending;

  if (settingsQuery.isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (settingsQuery.isError) {
    return <EmptyState title="Failed to load system settings" description={(settingsQuery.error as Error).message} />;
  }

  const assetFields: Array<[AssetKey, string]> = [
    ["logo", "Change Logo"],
    ["favicon", "Change Favicon"],
    ["splashScreen", "Change Splash Screen"],
    ["appIcon", "Change App Icon"],
    ["loginBackground", "Change Login Background"],
  ];

  return (
    <Stack spacing={3}>
      <PageHeader
        title="System Settings"
        subtitle="Manage branding, contacts, socials, localization, and app assets."
        icon={<Settings fontSize="small" />}
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              General Settings
            </Typography>
            <Stack spacing={2}>
              <TextField size="small" fullWidth label="Project Name" value={form.general.projectName} onChange={(e) => setValue("general", "projectName", e.target.value)} />
              <TextField size="small" fullWidth label="Footer Text" value={form.general.footerText} onChange={(e) => setValue("general", "footerText", e.target.value)} />
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Contact Settings
            </Typography>
            <Stack spacing={2}>
              <TextField size="small" fullWidth label="Phone" value={form.contact.phone} onChange={(e) => setValue("contact", "phone", e.target.value)} />
              <TextField size="small" fullWidth label="Email" value={form.contact.email} onChange={(e) => setValue("contact", "email", e.target.value)} />
              <TextField size="small" fullWidth label="WhatsApp" value={form.contact.whatsapp} onChange={(e) => setValue("contact", "whatsapp", e.target.value)} />
              <TextField size="small" fullWidth label="Address" value={form.contact.address} onChange={(e) => setValue("contact", "address", e.target.value)} />
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Social Media
            </Typography>
            <Stack spacing={2}>
              <TextField size="small" fullWidth label="Facebook URL" value={form.social.facebook} onChange={(e) => setValue("social", "facebook", e.target.value)} />
              <TextField size="small" fullWidth label="Instagram URL" value={form.social.instagram} onChange={(e) => setValue("social", "instagram", e.target.value)} />
              <TextField size="small" fullWidth label="X URL" value={form.social.x} onChange={(e) => setValue("social", "x", e.target.value)} />
              <TextField size="small" fullWidth label="TikTok URL" value={form.social.tiktok} onChange={(e) => setValue("social", "tiktok", e.target.value)} />
              <TextField size="small" fullWidth label="YouTube URL" value={form.social.youtube} onChange={(e) => setValue("social", "youtube", e.target.value)} />
            </Stack>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
              Application Settings
            </Typography>
            <Stack spacing={2}>
              <TextField size="small" fullWidth label="Currency" value={form.application.currency} onChange={(e) => setValue("application", "currency", e.target.value)} />
              <TextField size="small" fullWidth label="Language" value={form.application.language} onChange={(e) => setValue("application", "language", e.target.value)} />
              <TextField size="small" fullWidth label="Timezone" value={form.application.timezone} onChange={(e) => setValue("application", "timezone", e.target.value)} />
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          Asset Uploads
        </Typography>
        <Grid container spacing={2}>
          {assetFields.map(([key, label]) => (
            <Grid key={key} size={{ xs: 12, sm: 6, md: 4, lg: 2 }}>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Box sx={{ height: 112, display: "grid", placeItems: "center", bgcolor: "action.hover", borderRadius: 1, overflow: "hidden", mb: 1 }}>
                  {assetPreview[key] ? (
                    <Box component="img" src={assetPreview[key]} alt={label} sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <Image color="disabled" />
                  )}
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                  {label}
                </Typography>
                <Button component="label" variant="outlined" size="small" fullWidth>
                  Choose file
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) setFiles((prev) => ({ ...prev, [key]: file }));
                    }}
                  />
                </Button>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        <Button variant="outlined" onClick={onUploadAssets} disabled={isSaving}>
          {uploadMutation.isPending ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
          Upload Assets
        </Button>
        <Button variant="contained" startIcon={saveMutation.isPending ? <CircularProgress size={18} color="inherit" /> : <Save />} onClick={onSave} disabled={isSaving}>
          Save Settings
        </Button>
      </Stack>
    </Stack>
  );
}
