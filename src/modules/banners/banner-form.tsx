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
import {
  createAdminBannerApi,
  fetchAdminCompanies,
  fetchAdminProducts,
  updateAdminBannerApi,
  type AdminBanner,
} from "../../services/admin-api";
import { getApiErrorMessage } from "../../utils/api-error";
import { resolveAssetUrl } from "../../utils/asset-url";
import { useI18n } from "../../hooks/use-i18n";
import { BannerTargetFields, type BannerTargetType } from "./banner-target-fields";

function targetsFromBanner(banner?: AdminBanner | null): BannerTargetType[] {
  if (!banner) return ["company"];
  const next: BannerTargetType[] = [];
  if (banner.companyId || banner.company) next.push("company");
  if (banner.productId || banner.product) next.push("product");
  const url = banner.externalUrl || banner.navigation?.url;
  if (url) next.push("url");
  return next;
}

export type BannerFormProps = {
  banner?: AdminBanner | null;
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
  banner,
  onSuccess,
  onCancel,
  showActions = true,
  actionsSlot,
}: BannerFormProps) {
  const { t } = useI18n();
  const isEdit = Boolean(banner?.id);
  const [titleAr, setTitleAr] = useState(banner?.titleAr || banner?.title || "");
  const [titleEn, setTitleEn] = useState(banner?.titleEn || "");
  const [badgeTextAr, setBadgeTextAr] = useState(banner?.badgeTextAr || banner?.badgeText || "");
  const [badgeTextEn, setBadgeTextEn] = useState(banner?.badgeTextEn || "");
  const [selectedTargets, setSelectedTargets] = useState<BannerTargetType[]>(() => targetsFromBanner(banner));
  const [companyId, setCompanyId] = useState(banner?.companyId || banner?.company?.id || "");
  const [productId, setProductId] = useState(banner?.productId || banner?.product?.id || "");
  const [externalUrl, setExternalUrl] = useState(banner?.externalUrl || banner?.navigation?.url || "");
  const [sortOrder, setSortOrder] = useState(banner?.sortOrder ?? 0);
  const [displayDays, setDisplayDays] = useState<number | "">(banner ? banner.displayDays ?? "" : 7);
  const [isActive, setIsActive] = useState(banner?.isActive ?? true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ["admin-companies-approved-banners"],
    queryFn: () => fetchAdminCompanies({ page: 1, limit: 100, status: "APPROVED" }),
  });
  const companies = companiesData?.items || [];
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ["admin-products-banner-target"],
    queryFn: () => fetchAdminProducts({ page: 1, limit: 100, status: "ACTIVE", sortBy: "createdAt", sortOrder: "desc" }),
  });
  const products = productsData?.items || [];

  useEffect(() => {
    if (!imageFile) {
      setPreviewUrl(banner?.imagePath ? resolveAssetUrl(banner.imagePath) : null);
      return;
    }
    const url = URL.createObjectURL(imageFile);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile, banner?.imagePath]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!titleAr.trim()) throw new Error(t("banners.titleRequired"));
      if (!titleEn.trim()) throw new Error(t("banners.errorTitleEn"));
      if (!imageFile && !isEdit) throw new Error(t("banners.imageRequired"));
      if (displayDays !== "" && (Number.isNaN(Number(displayDays)) || Number(displayDays) < 1)) {
        throw new Error(t("banners.errorDisplayDays"));
      }
      if (selectedTargets.includes("company") && !companyId) {
        throw new Error(t("banners.companyRequired"));
      }
      if (selectedTargets.includes("product") && !productId) {
        throw new Error(t("banners.productRequired"));
      }
      if (selectedTargets.includes("url") && !externalUrl.trim()) {
        throw new Error(t("banners.urlRequired"));
      }
      const payload = {
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim(),
        badgeTextAr: badgeTextAr.trim() || undefined,
        badgeTextEn: badgeTextEn.trim() || undefined,
        badgeText: badgeTextAr.trim() || badgeTextEn.trim() || undefined,
        image: imageFile || undefined,
        linkType: selectedTargets.length > 1 ? "multi" : (selectedTargets[0] || undefined),
        companyId: selectedTargets.includes("company") ? companyId : undefined,
        productId: selectedTargets.includes("product") ? productId : undefined,
        externalUrl: selectedTargets.includes("url") ? externalUrl.trim() : undefined,
        linkValue: selectedTargets.includes("url") ? externalUrl.trim() : undefined,
        sortOrder: Number(sortOrder),
        displayDays: displayDays === "" ? null : Number(displayDays),
        isActive,
      };
      return isEdit && banner
        ? updateAdminBannerApi(banner.id, payload)
        : createAdminBannerApi({ ...payload, image: imageFile as File });
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

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <TextField
          size="small"
          fullWidth
          label={t("banners.fieldBadgeTextAr")}
          value={badgeTextAr}
          onChange={(e) => setBadgeTextAr(e.target.value)}
          placeholder="مثال: خصم 50% أو Flash sale أو عروض الجمعة البيضاء"
          helperText={t("banners.fieldBadgeTextHint")}
        />
        <TextField
          size="small"
          fullWidth
          label={t("banners.fieldBadgeTextEn")}
          value={badgeTextEn}
          onChange={(e) => setBadgeTextEn(e.target.value)}
          placeholder="e.g. 50% Off or Flash sale"
        />
      </Stack>

      <Button component="label" variant="outlined" fullWidth sx={{ borderRadius: "8px" }}>
        {t("banners.fieldImage")}
        <input hidden type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} />
      </Button>
      {isEdit && !imageFile ? (
        <Typography variant="caption" color="text.secondary">
          {t("banners.imageKeep")}
        </Typography>
      ) : null}
      {previewUrl ? (
        <Box
          component="img"
          src={previewUrl}
          alt=""
          sx={{ height: 128, width: "100%", borderRadius: "8px", objectFit: "cover" }}
        />
      ) : null}

      <BannerTargetFields
        selectedTargets={selectedTargets}
        onSelectedTargets={setSelectedTargets}
        companyId={companyId}
        onCompanyId={setCompanyId}
        productId={productId}
        onProductId={setProductId}
        externalUrl={externalUrl}
        onExternalUrl={setExternalUrl}
        companies={companies}
        companiesLoading={companiesLoading}
        products={products}
        productsLoading={productsLoading}
        t={t}
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
