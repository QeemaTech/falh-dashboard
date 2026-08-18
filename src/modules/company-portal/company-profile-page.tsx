import { useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Business, Email, LocationOn, Phone, PhotoCamera, WhatsApp } from "@mui/icons-material";
import {
  Avatar,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import { EmptyState, PageHeader } from "../../components/layout";
import { toast } from "../../components/ui/sonner";
import { useI18n } from "../../hooks/use-i18n";
import { fetchCompanyProfile, uploadCompanyLogoApi } from "../../services/company-api";
import { getApiErrorMessage } from "../../utils/api-error";
import { resolveAssetUrl } from "../../utils/asset-url";

function ProfileSkeleton() {
  return (
    <Stack spacing={3}>
      <Skeleton variant="rounded" height={88} />
      <Skeleton variant="rounded" height={320} />
    </Stack>
  );
}

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <Stack spacing={0.25}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 500 }}>
        {value || "-"}
      </Typography>
    </Stack>
  );
}

export function CompanyProfilePage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["company-profile"],
    queryFn: fetchCompanyProfile,
  });

  const uploadMutation = useMutation({
    mutationFn: uploadCompanyLogoApi,
    onSuccess: (profile) => {
      queryClient.setQueryData(["company-profile"], profile);
      queryClient.invalidateQueries({ queryKey: ["company-dashboard"] });
      toast.success(t("company.profile.logoUploadSuccess"));
    },
    onError: (err: unknown) => {
      toast.error(getApiErrorMessage(err, t("company.profile.logoUploadFailed")));
    },
  });

  if (isLoading) return <ProfileSkeleton />;

  if (isError || !data) {
    return (
      <EmptyState
        title={t("company.profile.loadFailed")}
        description={(error as Error)?.message}
      />
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader title={t("company.profile.title")} subtitle={t("company.profile.subtitle")} />

      <Paper sx={{ p: { xs: 2.5, md: 3 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2.5} sx={{ alignItems: { sm: "center" }, mb: 3 }}>
          <Box sx={{ position: "relative" }}>
            <Avatar
              variant="rounded"
              src={data.logo ? resolveAssetUrl(data.logo) : undefined}
              sx={{ width: 88, height: 88, bgcolor: "primary.main" }}
            >
              <Business />
            </Avatar>
            {uploadMutation.isPending ? (
              <Box
                sx={{
                  position: "absolute",
                  inset: 0,
                  display: "grid",
                  placeItems: "center",
                  bgcolor: "rgba(0,0,0,0.35)",
                  borderRadius: 1,
                }}
              >
                <CircularProgress size={28} sx={{ color: "common.white" }} />
              </Box>
            ) : null}
          </Box>

          <Stack spacing={1} sx={{ flex: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {data.name}
            </Typography>
            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
              <Chip
                size="small"
                label={data.status}
                color={data.status === "APPROVED" ? "success" : "warning"}
              />
              <Chip
                size="small"
                variant="outlined"
                label={
                  data.listingActive
                    ? t("company.dashboard.listingActive")
                    : t("company.dashboard.listingInactive")
                }
              />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                startIcon={<PhotoCamera />}
                disabled={uploadMutation.isPending}
                onClick={() => fileInputRef.current?.click()}
              >
                {data.logo ? t("company.profile.changeLogo") : t("company.profile.uploadLogo")}
              </Button>
              <Typography variant="caption" color="text.secondary">
                {t("company.profile.logoHint")}
              </Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error(t("company.profile.logoTooLarge"));
                    return;
                  }
                  uploadMutation.mutate(file);
                }}
              />
            </Stack>
          </Stack>
        </Stack>

        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t("company.profile.section.contact")}
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <Phone fontSize="small" color="action" />
                <InfoRow label={t("company.profile.phone")} value={data.phone} />
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <WhatsApp fontSize="small" color="action" />
                <InfoRow label={t("company.profile.whatsapp")} value={data.whatsappNumber} />
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <Email fontSize="small" color="action" />
                <InfoRow label={t("company.profile.publicEmail")} value={data.emailPublic} />
              </Stack>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                <LocationOn fontSize="small" color="action" />
                <InfoRow
                  label={t("company.profile.location")}
                  value={[data.city, data.address].filter(Boolean).join(" — ")}
                />
              </Stack>
            </Stack>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Stack spacing={2.5}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t("company.profile.section.account")}
              </Typography>
              <InfoRow label={t("company.profile.loginEmail")} value={data.loginEmail} />
              <InfoRow label={t("company.profile.applicant")} value={data.applicantName} />
              <InfoRow
                label={t("company.profile.quota")}
                value={`${data.productsCount} / ${data.maxProducts}`}
              />
              <InfoRow
                label={t("company.profile.listingPeriod")}
                value={
                  data.listingExpiresAt
                    ? `${data.displayDays} ${t("company.profile.days")} · ${new Date(data.listingExpiresAt).toLocaleDateString()}`
                    : `${data.displayDays} ${t("company.profile.days")}`
                }
              />
              <InfoRow
                label={t("company.profile.rating")}
                value={`${data.rating.toFixed(1)} (${data.reviewCount})`}
              />
            </Stack>
          </Grid>

          {data.description ? (
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
                {t("company.profile.description")}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                {data.description}
              </Typography>
            </Grid>
          ) : null}
        </Grid>
      </Paper>
    </Stack>
  );
}
