import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AppDrawer } from "../../components/design-system";
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
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [linkType, setLinkType] = useState("");
  const [linkValue, setLinkValue] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitleAr("");
    setTitleEn("");
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
      if (!titleAr.trim()) throw new Error(t("banners.titleRequired"));
      if (!titleEn.trim()) throw new Error(t("banners.errorTitleEn"));
      if (!imageFile) throw new Error(t("banners.imageRequired"));
      return createAdminBannerApi({
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
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
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? t("common.loading") : t("banners.save")}
          </Button>
          <Button onClick={onClose}>{t("banners.cancel")}</Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
        {error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : null}
        <TextField size="small" fullWidth label={t("banners.fieldTitleAr")} value={titleAr} onChange={(e) => setTitleAr(e.target.value)} />
        <TextField size="small" fullWidth label={t("banners.fieldTitleEn")} value={titleEn} onChange={(e) => setTitleEn(e.target.value)} />
        <Button component="label" variant="outlined" fullWidth>
          {t("banners.fieldImage")}
          <input hidden type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        </Button>
        {previewUrl ? (
          <Box component="img" src={previewUrl} alt="" sx={{ height: 128, width: "100%", borderRadius: 2, objectFit: "cover" }} />
        ) : null}
        <TextField select size="small" fullWidth label={t("banners.fieldLinkType")} value={linkType} onChange={(e) => setLinkType(e.target.value)}>
          {LINK_TYPES.map((item) => (
            <MenuItem key={item.value || "none"} value={item.value}>
              {t(item.labelKey)}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          size="small"
          fullWidth
          label={t("banners.fieldLinkValue")}
          value={linkValue}
          onChange={(e) => setLinkValue(e.target.value)}
          placeholder={t("banners.linkValuePlaceholder")}
          disabled={!linkType}
        />
        <TextField
          size="small"
          fullWidth
          type="number"
          label={t("banners.fieldSortOrder")}
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <FormControlLabel
          control={<Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
          label={t("banners.fieldActive")}
        />
      </Stack>
    </AppDrawer>
  );
}
