import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Image, Palette, Save } from "@mui/icons-material";
import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { toast } from "../../components/ui/sonner";
import { PageSection } from "../../components/layout";
import {
  fetchAppearanceSettings,
  updateAppearanceSettingsApi,
  uploadAppearanceAssetsApi,
  type AppearanceSettings,
} from "../../services/admin-api";

type AssetKey = "logo" | "loginLogo" | "loginBackground";

const baseApiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000/api";
const hostUrl = baseApiUrl.replace(/\/api\/?$/, "");
const themes = ["emerald", "blue", "amber", "violet", "rose"];

function toAbs(path?: string) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${hostUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

const initialAppearance: AppearanceSettings = {
  logo: "",
  loginLogo: "",
  loginBackground: "",
  dashboardTheme: "emerald",
  colorMode: "system",
  darkModeEnabled: true,
  lightModeEnabled: true,
};

const themeAccentColors: Record<string, string> = {
  emerald: "#23673A",
  blue: "#1976d2",
  amber: "#ed6c02",
  violet: "#7b1fa2",
  rose: "#e91e63",
};

export function AppearanceSettingsPage() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AppearanceSettings>(initialAppearance);
  const [files, setFiles] = useState<Partial<Record<AssetKey, File>>>({});

  const appearanceQuery = useQuery({
    queryKey: ["appearance-settings"],
    queryFn: fetchAppearanceSettings,
  });

  useEffect(() => {
    if (appearanceQuery.data) setForm(appearanceQuery.data);
  }, [appearanceQuery.data]);

  const saveMutation = useMutation({
    mutationFn: updateAppearanceSettingsApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appearance-settings"] });
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Appearance settings saved");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to save"),
  });

  const uploadMutation = useMutation({
    mutationFn: uploadAppearanceAssetsApi,
    onSuccess: () => {
      setFiles({});
      queryClient.invalidateQueries({ queryKey: ["appearance-settings"] });
      queryClient.invalidateQueries({ queryKey: ["system-settings"] });
      toast.success("Appearance assets uploaded");
    },
    onError: (error: unknown) => toast.error(error instanceof Error ? error.message : "Failed to upload"),
  });

  const previews = useMemo(
    () => ({
      logo: files.logo ? URL.createObjectURL(files.logo) : toAbs(form.logo),
      loginLogo: files.loginLogo ? URL.createObjectURL(files.loginLogo) : toAbs(form.loginLogo),
      loginBackground: files.loginBackground ? URL.createObjectURL(files.loginBackground) : toAbs(form.loginBackground),
    }),
    [files, form]
  );

  const previewBg =
    form.colorMode === "dark" ? "grey.900" : form.colorMode === "light" ? "common.white" : "grey.100";
  const previewColor =
    form.colorMode === "dark" ? "common.white" : "grey.900";
  const themeAccent = themeAccentColors[form.dashboardTheme] || themeAccentColors.emerald;

  const isBusy = saveMutation.isPending || uploadMutation.isPending;

  return (
    <Stack spacing={3}>
      <Paper
        sx={{
          p: 2.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "linear-gradient(90deg, #23673A 0%, #2f8f52 100%)",
          color: "common.white",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Appearance Management
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            Customize branding, login visuals, and dashboard look with live preview.
          </Typography>
        </Box>
        <Palette sx={{ fontSize: 40, opacity: 0.8 }} />
      </Paper>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={3}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Appearance Settings
              </Typography>

              <PageSection title="Dashboard Theme">
                <ToggleButtonGroup
                  size="small"
                  value={form.dashboardTheme}
                  exclusive
                  onChange={(_e, value) => {
                    if (value) setForm((prev) => ({ ...prev, dashboardTheme: value }));
                  }}
                  sx={{ flexWrap: "wrap" }}
                >
                  {themes.map((theme) => (
                    <ToggleButton key={theme} value={theme} sx={{ textTransform: "capitalize" }}>
                      {theme}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </PageSection>

              <PageSection title="Color Mode">
                <ToggleButtonGroup
                  size="small"
                  value={form.colorMode}
                  exclusive
                  onChange={(_e, value) => {
                    if (value) setForm((prev) => ({ ...prev, colorMode: value }));
                  }}
                >
                  {(["light", "dark", "system"] as const).map((mode) => (
                    <ToggleButton key={mode} value={mode} sx={{ textTransform: "capitalize" }}>
                      {mode}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </PageSection>

              <Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.darkModeEnabled}
                      onChange={(e) => setForm((prev) => ({ ...prev, darkModeEnabled: e.target.checked }))}
                    />
                  }
                  label="Enable Dark Mode"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.lightModeEnabled}
                      onChange={(e) => setForm((prev) => ({ ...prev, lightModeEnabled: e.target.checked }))}
                    />
                  }
                  label="Enable Light Mode"
                />
              </Stack>

              <Grid container spacing={2}>
                {(
                  [
                    ["logo", "Change Logo"],
                    ["loginLogo", "Change Login Logo"],
                    ["loginBackground", "Change Login Background"],
                  ] as Array<[AssetKey, string]>
                ).map(([key, label]) => (
                  <Grid key={key} size={{ xs: 12, sm: 4 }}>
                    <Paper variant="outlined" sx={{ p: 1.5 }}>
                      <Stack spacing={1.5}>
                        <Box
                          sx={{
                            height: 96,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            borderRadius: 1,
                            bgcolor: "action.hover",
                            overflow: "hidden",
                          }}
                        >
                          {previews[key] ? (
                            <Box
                              component="img"
                              src={previews[key]}
                              alt={label}
                              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Image color="disabled" />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {label}
                        </Typography>
                        <Button variant="outlined" component="label" size="small" fullWidth>
                          Choose file
                          <input
                            type="file"
                            accept="image/*"
                            hidden
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setFiles((prev) => ({ ...prev, [key]: file }));
                            }}
                          />
                        </Button>
                      </Stack>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper sx={{ p: 2.5 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Live Preview
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  overflow: "hidden",
                  bgcolor: previewBg,
                  color: previewColor,
                }}
              >
                <Box sx={{ height: 8, bgcolor: themeAccent }} />
                <Stack spacing={2} sx={{ p: 2 }}>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <Box
                      sx={{
                        width: 32,
                        height: 32,
                        borderRadius: 1,
                        bgcolor: "grey.300",
                        overflow: "hidden",
                      }}
                    >
                      {previews.logo ? (
                        <Box
                          component="img"
                          src={previews.logo}
                          alt="Logo preview"
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : null}
                    </Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Dashboard Header
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      borderRadius: 1,
                      border: 1,
                      borderColor: "divider",
                      backgroundImage: previews.loginBackground ? `url(${previews.loginBackground})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      p: 1.5,
                    }}
                  >
                    <Box sx={{ borderRadius: 1, bgcolor: "rgba(0,0,0,0.4)", p: 1.5, color: "common.white" }}>
                      <Box
                        sx={{
                          mb: 1,
                          height: 32,
                          width: 96,
                          borderRadius: 1,
                          bgcolor: "rgba(255,255,255,0.2)",
                          overflow: "hidden",
                        }}
                      >
                        {previews.loginLogo ? (
                          <Box
                            component="img"
                            src={previews.loginLogo}
                            alt="Login logo preview"
                            sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                          />
                        ) : null}
                      </Box>
                      <Typography variant="caption">Login screen preview</Typography>
                    </Box>
                  </Box>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    Mode: {form.colorMode} | Theme: {form.dashboardTheme}
                  </Typography>
                </Stack>
              </Paper>
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button variant="outlined" onClick={() => uploadMutation.mutate(files)} disabled={isBusy}>
            {uploadMutation.isPending ? <CircularProgress size={18} sx={{ mr: 1 }} /> : null}
            Upload Assets
          </Button>
          <Button
            variant="contained"
            onClick={() => saveMutation.mutate(form)}
            disabled={isBusy}
            startIcon={saveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Save />}
          >
            Save Appearance
          </Button>
        </Stack>
      </Paper>
    </Stack>
  );
}
