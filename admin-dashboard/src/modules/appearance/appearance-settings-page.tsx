import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageUp, Loader2, Palette, Save } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { toast } from "../../components/ui/sonner";
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

  const modePreviewClass =
    form.colorMode === "dark" ? "bg-neutral-900 text-white" : form.colorMode === "light" ? "bg-white text-neutral-900" : "bg-neutral-100 text-neutral-900 dark:bg-neutral-900 dark:text-white";
  const themeAccent =
    form.dashboardTheme === "blue"
      ? "bg-blue-600"
      : form.dashboardTheme === "amber"
        ? "bg-amber-500"
        : form.dashboardTheme === "violet"
          ? "bg-violet-600"
          : form.dashboardTheme === "rose"
            ? "bg-rose-600"
            : "bg-emerald-700";

  const isBusy = saveMutation.isPending || uploadMutation.isPending;

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between bg-linear-to-r from-[#23673A] to-[#2f8f52] text-white">
        <div>
          <h2 className="text-xl font-semibold">Appearance Management</h2>
          <p className="text-sm text-white/90">Customize branding, login visuals, and dashboard look with live preview.</p>
        </div>
        <Palette className="size-10 opacity-80" />
      </Card>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="space-y-3 lg:col-span-7">
          <h3 className="font-semibold">Appearance Settings</h3>

          <div>
            <p className="mb-1 text-xs text-neutral-500">Dashboard Theme</p>
            <div className="flex flex-wrap gap-2">
              {themes.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, dashboardTheme: theme }))}
                  className={`rounded-lg border px-3 py-2 text-sm capitalize ${form.dashboardTheme === theme ? "border-[#23673A] bg-[#23673A]/10" : ""}`}
                >
                  {theme}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs text-neutral-500">Color Mode</p>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, colorMode: mode }))}
                  className={`rounded-lg border px-3 py-2 text-sm capitalize ${form.colorMode === mode ? "border-[#23673A] bg-[#23673A]/10" : ""}`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.darkModeEnabled}
                onChange={(e) => setForm((prev) => ({ ...prev, darkModeEnabled: e.target.checked }))}
              />
              Enable Dark Mode
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.lightModeEnabled}
                onChange={(e) => setForm((prev) => ({ ...prev, lightModeEnabled: e.target.checked }))}
              />
              Enable Light Mode
            </label>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {(
              [
                ["logo", "Change Logo"],
                ["loginLogo", "Change Login Logo"],
                ["loginBackground", "Change Login Background"],
              ] as Array<[AssetKey, string]>
            ).map(([key, label]) => (
              <div key={key} className="space-y-2 rounded-xl border p-3">
                <div className="flex h-24 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                  {previews[key] ? <img src={previews[key]} alt={label} className="h-full w-full object-cover" /> : <ImageUp className="size-5 text-neutral-400" />}
                </div>
                <label className="block">
                  <span className="mb-1 block text-xs text-neutral-500">{label}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full text-xs"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setFiles((prev) => ({ ...prev, [key]: file }));
                    }}
                  />
                </label>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-3 lg:col-span-5">
          <h3 className="font-semibold">Live Preview</h3>
          <div className={`overflow-hidden rounded-xl border ${modePreviewClass}`}>
            <div className={`h-2 ${themeAccent}`} />
            <div className="space-y-3 p-3">
              <div className="flex items-center gap-2">
                <div className="size-8 overflow-hidden rounded-md bg-neutral-200">
                  {previews.logo ? <img src={previews.logo} alt="Logo preview" className="h-full w-full object-cover" /> : null}
                </div>
                <div className="text-sm font-medium">Dashboard Header</div>
              </div>
              <div
                className="rounded-lg border bg-center bg-cover p-3"
                style={{ backgroundImage: previews.loginBackground ? `url(${previews.loginBackground})` : undefined }}
              >
                <div className="rounded-md bg-black/40 p-3 text-white">
                  <div className="mb-2 h-8 w-24 overflow-hidden rounded bg-white/20">
                    {previews.loginLogo ? <img src={previews.loginLogo} alt="Login logo preview" className="h-full w-full object-cover" /> : null}
                  </div>
                  <p className="text-xs">Login screen preview</p>
                </div>
              </div>
              <p className="text-xs opacity-80">
                Mode: {form.colorMode} | Theme: {form.dashboardTheme}
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => uploadMutation.mutate(files)} disabled={isBusy}>
          {uploadMutation.isPending ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
          Upload Assets
        </Button>
        <Button onClick={() => saveMutation.mutate(form)} disabled={isBusy}>
          {saveMutation.isPending ? <Loader2 className="me-2 size-4 animate-spin" /> : <Save className="me-2 size-4" />}
          Save Appearance
        </Button>
      </Card>
    </div>
  );
}
