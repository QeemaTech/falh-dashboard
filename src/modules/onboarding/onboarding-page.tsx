import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add, Delete, ViewCarousel } from "@mui/icons-material";
import { Box, Button, CircularProgress, IconButton, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  AppBadge,
  AppModal,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
  AppTableRow,
} from "../../components/design-system";
import { EmptyState, PageHeader } from "../../components/layout";
import {
  deleteAdminOnboardingSlideApi,
  fetchAdminOnboardingSlides,
  type AdminOnboardingSlide,
} from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import { getApiErrorMessage } from "../../utils/api-error";
import { toast } from "../../components/ui/sonner";
import { useI18n } from "../../hooks/use-i18n";

export function OnboardingPage() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const slideTitle = (slide: AdminOnboardingSlide) =>
    language === "ar" ? slide.titleAr : slide.titleEn || slide.titleAr;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-onboarding-slides"],
    queryFn: fetchAdminOnboardingSlides,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminOnboardingSlideApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-onboarding-slides"] });
      setConfirmDeleteId(null);
      toast.success(t("onboarding.deleted"));
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, t("onboarding.deleteFailed"))),
  });

  const slides = useMemo(() => (data || []) as AdminOnboardingSlide[], [data]);

  return (
    <Stack spacing={3}>
      <PageHeader
        title={t("onboarding.title")}
        subtitle={t("onboarding.subtitle")}
        icon={<ViewCarousel fontSize="small" />}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/onboarding/new")}>
            {t("onboarding.addButton")}
          </Button>
        }
      />

      {isLoading ? (
        <Stack sx={{ py: 6, alignItems: "center" }}>
          <CircularProgress size={28} />
        </Stack>
      ) : null}

      {isError ? (
        <EmptyState title={t("onboarding.loadFailed")} description={getApiErrorMessage(error)} />
      ) : null}

      {!isLoading && !isError && !slides.length ? (
        <EmptyState
          icon={<ViewCarousel sx={{ fontSize: 48 }} />}
          title={t("onboarding.empty")}
          action={
            <Button variant="contained" startIcon={<Add />} onClick={() => navigate("/onboarding/new")}>
              {t("onboarding.addButton")}
            </Button>
          }
        />
      ) : null}

      {!isLoading && !isError && slides.length > 0 ? (
        <AppTable title={t("onboarding.listTitle")}>
          <AppTableHead>
            <tr>
              <AppTableHeaderCell>{t("onboarding.colImage")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("onboarding.colTitle")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("onboarding.colSortOrder")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("onboarding.colStatus")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("onboarding.colActions")}</AppTableHeaderCell>
            </tr>
          </AppTableHead>
          <tbody>
            {slides.map((slide) => (
              <AppTableRow key={slide.id}>
                <AppTableCell>
                  {slide.imagePath ? (
                    <Box
                      component="img"
                      src={resolveAssetUrl(slide.imagePath)}
                      alt={slideTitle(slide)}
                      sx={{ height: 56, width: 96, borderRadius: "8px", objectFit: "cover" }}
                    />
                  ) : (
                    <Box sx={{ height: 56, width: 96, borderRadius: "8px", bgcolor: "action.hover" }} />
                  )}
                </AppTableCell>
                <AppTableCell>{slideTitle(slide)}</AppTableCell>
                <AppTableCell>{slide.sortOrder ?? 0}</AppTableCell>
                <AppTableCell>
                  <AppBadge variant={slide.isActive ? "success" : "neutral"}>
                    {slide.isActive ? t("onboarding.active") : t("onboarding.inactive")}
                  </AppBadge>
                </AppTableCell>
                <AppTableCell>
                  <IconButton
                    color="error"
                    size="small"
                    disabled={deleteMutation.isPending}
                    onClick={() => setConfirmDeleteId(slide.id)}
                  >
                    <Delete fontSize="small" />
                  </IconButton>
                </AppTableCell>
              </AppTableRow>
            ))}
          </tbody>
        </AppTable>
      ) : null}

      <AppModal
        open={Boolean(confirmDeleteId)}
        onClose={() => setConfirmDeleteId(null)}
        title={t("onboarding.confirmDelete")}
        footer={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="error"
              disabled={deleteMutation.isPending}
              onClick={() => confirmDeleteId && deleteMutation.mutate(confirmDeleteId)}
              sx={{ borderRadius: "8px" }}
            >
              {t("common.delete", "Delete")}
            </Button>
            <Button onClick={() => setConfirmDeleteId(null)} sx={{ borderRadius: "8px" }}>
              {t("onboarding.cancel")}
            </Button>
          </Stack>
        }
      >
        <Typography variant="body2">{t("onboarding.confirmDelete")}</Typography>
      </AppModal>
    </Stack>
  );
}
