import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AppDrawer } from "../../components/design-system";
import { createAdminOnboardingSlideApi } from "../../services/admin-api";
import { getApiErrorMessage } from "../../utils/api-error";
import { useI18n } from "../../hooks/use-i18n";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function OnboardingFormDrawer({ open, onClose, onSuccess }: Props) {
  const { t } = useI18n();
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [subtitleAr, setSubtitleAr] = useState("");
  const [subtitleEn, setSubtitleEn] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setTitleAr("");
    setTitleEn("");
    setSubtitleAr("");
    setSubtitleEn("");
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
      if (!titleAr.trim()) throw new Error(t("onboarding.titleRequired"));
      if (!imageFile) throw new Error(t("onboarding.imageRequired"));
      return createAdminOnboardingSlideApi({
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim() || undefined,
        subtitleAr: subtitleAr.trim() || undefined,
        subtitleEn: subtitleEn.trim() || undefined,
        image: imageFile,
        sortOrder: Number(sortOrder),
        isActive,
      });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, t("onboarding.saveFailed"))),
  });

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={t("onboarding.addTitle")}
      description={t("onboarding.addDescription")}
      footer={
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
            {saveMutation.isPending ? t("common.loading") : t("onboarding.save")}
          </Button>
          <Button onClick={onClose}>{t("onboarding.cancel")}</Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
        {error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : null}
        <TextField
          size="small"
          fullWidth
          label={t("onboarding.fieldTitleAr")}
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
        />
        <TextField
          size="small"
          fullWidth
          label={t("onboarding.fieldTitleEn")}
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
        />
        <TextField
          size="small"
          fullWidth
          label={t("onboarding.fieldSubtitleAr")}
          value={subtitleAr}
          onChange={(e) => setSubtitleAr(e.target.value)}
        />
        <TextField
          size="small"
          fullWidth
          label={t("onboarding.fieldSubtitleEn")}
          value={subtitleEn}
          onChange={(e) => setSubtitleEn(e.target.value)}
        />
        <Button component="label" variant="outlined" fullWidth>
          {t("onboarding.fieldImage")}
          <input hidden type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
        </Button>
        {previewUrl ? (
          <Box component="img" src={previewUrl} alt="" sx={{ height: 128, width: "100%", borderRadius: "8px", objectFit: "cover" }} />
        ) : null}

        <TextField
          size="small"
          fullWidth
          type="number"
          label={t("onboarding.fieldSortOrder")}
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <FormControlLabel
          control={<Checkbox checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
          label={t("onboarding.fieldActive")}
        />
      </Stack>
    </AppDrawer>
  );
}
