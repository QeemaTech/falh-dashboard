import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AppDrawer, AppSelect } from "../../components/design-system";
import { createAdminBannerApi } from "../../services/admin-api";
import { getApiErrorMessage } from "../../utils/api-error";
import { useI18n } from "../../hooks/use-i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const LINK_TYPES = [
  { value: "", labelKey: "banners.linkNone" },
  { value: "url", labelKey: "banners.linkUrl" },
  { value: "product", labelKey: "banners.linkProduct" },
  { value: "company", labelKey: "banners.linkCompany" },
  { value: "category", labelKey: "banners.linkCategory" },
  { value: "service_provider", labelKey: "banners.linkProvider" },
];

export function BannerFormDrawer({ open, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [linkType, setLinkType] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setLinkType("");
    setLinkValue("");
    setSortOrder(0);
    setIsActive(true);
    setImageFile(null);
    setPreviewUrl(null);
    setError(null);
  }, [open]);

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error(t("banners.titleRequired"));
      if (!imageFile) throw new Error(t("banners.imageRequired"));
      return createAdminBannerApi({
        title: title.trim(),
        image: imageFile,
        linkType: linkType || undefined,
        linkValue: linkValue.trim() || undefined,
        sortOrder: Number(sortOrder),
        isActive,
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, t("banners.saveFailed"))),
  });

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={t("banners.addTitle")}
      description={t("banners.addDescription")}
      footer={
        <>
          <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? t("common.loading") : t("banners.save")}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t("banners.cancel")}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        {error ? <p className="text-red-500">{error}</p> : null}
        <div>
          <label className="font-medium text-(--app-text-primary)">{t("banners.fieldTitle")}</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} className="mt-1" />
        </div>
        <div>
          <label className="font-medium text-(--app-text-primary)">{t("banners.fieldImage")}</label>
          <Input
            type="file"
            accept="image/*"
            className="mt-1"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          />
          {previewUrl ? (
            <img src={previewUrl} alt="" className="mt-2 h-32 w-full rounded-xl object-cover" />
          ) : null}
        </div>
        <div>
          <label className="font-medium text-(--app-text-primary)">{t("banners.fieldLinkType")}</label>
          <AppSelect value={linkType} onChange={(e) => setLinkType(e.target.value)} className="mt-1">
            {LINK_TYPES.map((item) => (
              <option key={item.value || "none"} value={item.value}>
                {t(item.labelKey)}
              </option>
            ))}
          </AppSelect>
        </div>
        <div>
          <label className="font-medium text-(--app-text-primary)">{t("banners.fieldLinkValue")}</label>
          <Input
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            placeholder={t("banners.linkValuePlaceholder")}
            className="mt-1"
            disabled={!linkType}
          />
        </div>
        <div>
          <label className="font-medium text-(--app-text-primary)">{t("banners.fieldSortOrder")}</label>
          <Input
            type="number"
            min={0}
            value={sortOrder}
            onChange={(e) => setSortOrder(Number(e.target.value))}
            className="mt-1"
          />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          <span>{t("banners.fieldActive")}</span>
        </label>
      </div>
    </AppDrawer>
  );
}
