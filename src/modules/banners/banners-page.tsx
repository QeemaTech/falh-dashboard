import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add, Campaign, Delete } from "@mui/icons-material";
import { Box, Button, CircularProgress, IconButton, Stack } from "@mui/material";
import { AppBadge, AppTable, AppTableCell, AppTableHead, AppTableHeaderCell, AppTableRow } from "../../components/design-system";
import { EmptyState, PageHeader } from "../../components/layout";
import { deleteAdminBannerApi, fetchAdminBanners, type AdminBanner } from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import { getApiErrorMessage } from "../../utils/api-error";
import { BannerFormDrawer } from "./banner-form-drawer";
import { toast } from "../../components/ui/sonner";
import { useI18n } from "../../hooks/use-i18n";

export function BannersPage() {
  const { t, language } = useI18n();

  const bannerTitle = (banner: AdminBanner) =>
    language === "ar"
      ? banner.titleAr || banner.title
      : banner.titleEn || banner.titleAr || banner.title;

  const bannerDisplayLabel = (banner: AdminBanner) => {
    if (!banner.displayDays) return t("banners.unlimited");
    const expired = banner.expiresAt && new Date(banner.expiresAt) <= new Date();
    const daysLeft = banner.expiresAt
      ? Math.max(0, Math.ceil((new Date(banner.expiresAt).getTime() - Date.now()) / 86400000))
      : banner.displayDays;
    if (expired) return t("banners.expired");
    return t("banners.daysRemaining").replace("{{days}}", String(daysLeft));
  };

  const bannerStatusVariant = (banner: AdminBanner): "success" | "warning" | "neutral" => {
    if (!banner.isActive) return "neutral";
    if (banner.expiresAt && new Date(banner.expiresAt) <= new Date()) return "warning";
    return "success";
  };
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: fetchAdminBanners,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminBannerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success(t("banners.deleted"));
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, t("banners.deleteFailed"))),
  });

  const banners = useMemo(() => (data || []) as AdminBanner[], [data]);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-banners"] });

  return (
    <Stack spacing={3}>
      <PageHeader
        title={t("banners.title")}
        subtitle={t("banners.subtitle")}
        icon={<Campaign fontSize="small" />}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormOpen(true)}>
            {t("banners.addButton")}
          </Button>
        }
      />

      {isLoading ? (
        <Stack sx={{ py: 6, alignItems: "center" }}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      {isError ? (
        <EmptyState title={t("banners.loadFailed")} description={getApiErrorMessage(error)} />
      ) : null}

      {!isLoading && !isError && !banners.length ? (
        <EmptyState
          icon={<Campaign sx={{ fontSize: 48 }} />}
          title={t("banners.empty")}
          action={
            <Button variant="contained" startIcon={<Add />} onClick={() => setFormOpen(true)}>
              {t("banners.addButton")}
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && banners.length > 0 ? (
        <AppTable title={t("banners.listTitle")}>
          <AppTableHead>
            <tr>
              <AppTableHeaderCell>{t("banners.colImage")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("banners.colTitle")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("banners.colLinkType")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("banners.colSortOrder")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("banners.colDisplay")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("banners.colStatus")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("banners.colActions")}</AppTableHeaderCell>
            </tr>
          </AppTableHead>
          <tbody>
            {banners.map((banner) => (
              <AppTableRow key={banner.id}>
                <AppTableCell>
                  {banner.imagePath ? (
                    <Box
                      component="img"
                      src={resolveAssetUrl(banner.imagePath)}
                      alt={bannerTitle(banner)}
                      sx={{ height: 56, width: 96, borderRadius: 1, objectFit: "cover" }}
                    />
                  ) : (
                    <Box sx={{ height: 56, width: 96, borderRadius: 1, bgcolor: "action.hover" }} />
                  )}
                </AppTableCell>
                <AppTableCell>{bannerTitle(banner)}</AppTableCell>
                <AppTableCell>{banner.linkType || "—"}</AppTableCell>
                <AppTableCell>{banner.sortOrder ?? 0}</AppTableCell>
                <AppTableCell>{bannerDisplayLabel(banner)}</AppTableCell>
                <AppTableCell>
                  <AppBadge variant={bannerStatusVariant(banner)}>
                    {!banner.isActive
                      ? t("banners.inactive")
                      : banner.expiresAt && new Date(banner.expiresAt) <= new Date()
                        ? t("banners.expired")
                        : t("banners.active")}
                  </AppBadge>
                </AppTableCell>
                <AppTableCell>
                  <IconButton
                    color="error"
                    size="small"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(t("banners.confirmDelete"))) {
                        deleteMutation.mutate(banner.id);
                      }
                    }}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </AppTableCell>
              </AppTableRow>
            ))}
          </tbody>
        </AppTable>
      ) : null}

      <BannerFormDrawer open={formOpen} onClose={() => setFormOpen(false)} onSuccess={invalidate} />
    </Stack>
  );
}
