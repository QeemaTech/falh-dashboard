import { useEffect, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { createAdminBannerApi, fetchAdminCompanies } from "../../services/admin-api";
import { getApiErrorMessage } from "../../utils/api-error";
import { useI18n } from "../../hooks/use-i18n";
import { BannerCompanyPicker } from "./banner-company-picker";

export type BannerFormProps = {
  onSuccess: () => void;
  onCancel: () => void;
  showActions?: boolean;
  actionsSlot?: (props: {
    saving: boolean;
    onSave: () => void;
    onCancel: () => void;
  }) => ReactNode;
};

export function BannerForm({
  onSuccess,
  onCancel,
  showActions = true,
  actionsSlot,
}: BannerFormProps) {
  const { t } = useI18n();
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [displayDays, setDisplayDays] = useState<number | "">(7);
  const [isActive, setIsActive] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ["admin-companies-approved-banners"],
    queryFn: () => fetchAdminCompanies({ page: 1, limit: 100, status: "APPROVED" }),
  });
  const companies = companiesData?.items || [];

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
      if (displayDays !== "" && (Number.isNaN(Number(displayDays)) || Number(displayDays) < 1)) {
        throw new Error(t("banners.errorDisplayDays"));
      }
      return createAdminBannerApi({
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        image: imageFile,
        companyId: companyId || undefined,
        sortOrder: Number(sortOrder),
        displayDays: displayDays === "" ? null : Number(displayDays),
        isActive,
      });
    },
    onSuccess: () => onSuccess(),
    onError: (err: unknown) => setError(getApiErrorMessage(err, t("banners.saveFailed"))),
  });

  const actions = actionsSlot?.({
    saving: saveMutation.isPending,
    onSave: () => saveMutation.mutate(),
    onCancel,
  });

  return (
    <Stack spacing={2.5}>
      {error ? (
        <Typography variant="body2" color="error">
          {error}
        </Typography>
      ) : null}
      <TextField
        size="small"
        fullWidth
        label={t("banners.fieldTitleAr")}
        value={titleAr}
        onChange={(e) => setTitleAr(e.target.value)}
      />
      <TextField
        size="small"
        fullWidth
        label={t("banners.fieldTitleEn")}
        value={titleEn}
        onChange={(e) => setTitleEn(e.target.value)}
      />
      <Button component="label" variant="outlined" fullWidth sx={{ borderRadius: "8px" }}>
        {t("banners.fieldImage")}
        <input hidden type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
      </Button>
      {previewUrl ? (
        <Box
          component="img"
          src={previewUrl}
          alt=""
          sx={{ height: 128, width: "100%", borderRadius: "8px", objectFit: "cover" }}
        />
      ) : null}

      <BannerCompanyPicker
        companies={companies}
        loading={companiesLoading}
        selectedCompanyId={companyId}
        onSelect={setCompanyId}
        label={t("banners.fieldCompany")}
        hint={t("banners.fieldCompanyHint")}
        searchPlaceholder={t("banners.fieldCompanySearch")}
        emptyLabel={t("banners.fieldCompanyEmpty")}
      />

      <TextField
        size="small"
        fullWidth
        type="number"
        label={t("banners.fieldDisplayDays")}
        value={displayDays}
        onChange={(e) => {
          const raw = e.target.value;
          setDisplayDays(raw === "" ? "" : Number(raw));
        }}
        placeholder={t("banners.fieldDisplayDaysHint")}
        helperText={t("banners.fieldDisplayDaysHelp")}
        slotProps={{ htmlInput: { min: 1 } }}
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

      {showActions ? (
        <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
          {actions ?? (
            <>
              <Button
                variant="contained"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                sx={{ borderRadius: "8px" }}
              >
                {saveMutation.isPending ? t("common.loading") : t("banners.save")}
              </Button>
              <Button onClick={onCancel} sx={{ borderRadius: "8px" }}>
                {t("banners.cancel")}
              </Button>
            </>
          )}
        </Stack>
      ) : null}
    </Stack>
  );
}
