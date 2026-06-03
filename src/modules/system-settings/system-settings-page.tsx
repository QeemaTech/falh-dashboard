import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ImageUp, Loader2, Save, Settings2 } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
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

  const onUploadAssets = () => {
    uploadMutation.mutate(files);
  };

  const isSaving = saveMutation.isPending || uploadMutation.isPending;

  if (settingsQuery.isLoading) return <Card>Loading system settings...</Card>;
  if (settingsQuery.isError) return <Card>Failed to load system settings: {(settingsQuery.error as Error).message}</Card>;

  return (
    <div className="space-y-4">
      <Card className="flex items-center justify-between bg-linear-to-r from-[#23673A] to-[#2f8f52] text-white">
        <div>
          <h2 className="text-xl font-semibold">System Settings</h2>
          <p className="text-sm text-white/90">Manage branding, contacts, socials, localization, and app assets.</p>
        </div>
        <Settings2 className="size-10 opacity-80" />
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="space-y-3">
          <h3 className="font-semibold">General Settings</h3>
          <Input value={form.general.projectName} onChange={(e) => setValue("general", "projectName", e.target.value)} placeholder="Project Name" />
          <Input value={form.general.footerText} onChange={(e) => setValue("general", "footerText", e.target.value)} placeholder="Footer Text" />
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold">Contact Settings</h3>
          <Input value={form.contact.phone} onChange={(e) => setValue("contact", "phone", e.target.value)} placeholder="Phone" />
          <Input value={form.contact.email} onChange={(e) => setValue("contact", "email", e.target.value)} placeholder="Email" />
          <Input value={form.contact.whatsapp} onChange={(e) => setValue("contact", "whatsapp", e.target.value)} placeholder="WhatsApp" />
          <Input value={form.contact.address} onChange={(e) => setValue("contact", "address", e.target.value)} placeholder="Address" />
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold">Social Media</h3>
          <Input value={form.social.facebook} onChange={(e) => setValue("social", "facebook", e.target.value)} placeholder="Facebook URL" />
          <Input value={form.social.instagram} onChange={(e) => setValue("social", "instagram", e.target.value)} placeholder="Instagram URL" />
          <Input value={form.social.x} onChange={(e) => setValue("social", "x", e.target.value)} placeholder="X URL" />
          <Input value={form.social.tiktok} onChange={(e) => setValue("social", "tiktok", e.target.value)} placeholder="TikTok URL" />
          <Input value={form.social.youtube} onChange={(e) => setValue("social", "youtube", e.target.value)} placeholder="YouTube URL" />
        </Card>

        <Card className="space-y-3">
          <h3 className="font-semibold">Application Settings</h3>
          <Input value={form.application.currency} onChange={(e) => setValue("application", "currency", e.target.value)} placeholder="Currency" />
          <Input value={form.application.language} onChange={(e) => setValue("application", "language", e.target.value)} placeholder="Language (e.g. ar, en)" />
          <Input value={form.application.timezone} onChange={(e) => setValue("application", "timezone", e.target.value)} placeholder="Timezone" />
        </Card>
      </div>

      <Card className="space-y-3">
        <h3 className="font-semibold">Asset Uploads</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {(
            [
              ["logo", "Change Logo"],
              ["favicon", "Change Favicon"],
              ["splashScreen", "Change Splash Screen"],
              ["appIcon", "Change App Icon"],
              ["loginBackground", "Change Login Background"],
            ] as Array<[AssetKey, string]>
          ).map(([key, label]) => (
            <div key={key} className="space-y-2 rounded-xl border p-3">
              <div className="flex h-28 items-center justify-center overflow-hidden rounded-lg bg-neutral-100 dark:bg-neutral-800">
                {assetPreview[key] ? (
                  <img src={assetPreview[key]} alt={label} className="h-full w-full object-cover" />
                ) : (
                  <ImageUp className="size-6 text-neutral-400" />
                )}
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

      <Card className="flex flex-wrap items-center justify-end gap-2">
        <Button variant="outline" onClick={onUploadAssets} disabled={isSaving}>
          {uploadMutation.isPending ? <Loader2 className="me-2 size-4 animate-spin" /> : null}
          Upload Assets
        </Button>
        <Button onClick={onSave} disabled={isSaving}>
          {saveMutation.isPending ? <Loader2 className="me-2 size-4 animate-spin" /> : <Save className="me-2 size-4" />}
          Save Settings
        </Button>
      </Card>
    </div>
  );
}
