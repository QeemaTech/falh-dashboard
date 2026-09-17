import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Add, Delete, ViewCarousel } from "@mui/icons-material";
import { Box, Button, CircularProgress, IconButton, Stack } from "@mui/material";
import { AppBadge, AppTable, AppTableCell, AppTableHead, AppTableHeaderCell, AppTableRow } from "../../components/design-system";
import { EmptyState, PageHeader } from "../../components/layout";
import {
  deleteAdminOnboardingSlideApi,
  fetchAdminOnboardingSlides,
  type AdminOnboardingSlide,
} from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import { getApiErrorMessage } from "../../utils/api-error";
import { OnboardingFormDrawer } from "./onboarding-form-drawer";
import { toast } from "../../components/ui/sonner";
import { useI18n } from "../../hooks/use-i18n";

export function OnboardingPage() {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

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
      toast.success(t("onboarding.deleted"));
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, t("onboarding.deleteFailed"))),
  });

  const slides = useMemo(() => (data || []) as AdminOnboardingSlide[], [data]);
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-onboarding-slides"] });

  return (
    <Stack spacing={3}>
      <PageHeader
        title={t("onboarding.title")}
        subtitle={t("onboarding.subtitle")}
        icon={<ViewCarousel fontSize="small" />}
        action={
          <Button variant="contained" startIcon={<Add />} onClick={() => setFormOpen(true)}>
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
            <Button variant="contained" startIcon={<Add />} onClick={() => setFormOpen(true)}>
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
                      sx={{ height: 56, width: 96, borderRadius: 1, objectFit: "cover" }}
                    />
                  ) : (
                    <Box sx={{ height: 56, width: 96, borderRadius: 1, bgcolor: "action.hover" }} />
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
                    onClick={() => {
                      if (window.confirm(t("onboarding.confirmDelete"))) {
                        deleteMutation.mutate(slide.id);
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

      <OnboardingFormDrawer open={formOpen} onClose={() => setFormOpen(false)} onSuccess={invalidate} />
    </Stack>
  );
}
