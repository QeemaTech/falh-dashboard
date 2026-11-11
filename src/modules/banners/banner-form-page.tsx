import { CircularProgress, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FormPageShell } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { fetchAdminBanners } from "../../services/admin-api";
import { BannerForm } from "./banner-form";

export function BannerCreatePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <FormPageShell title={t("banners.addTitle")} subtitle={t("banners.addDescription")} backTo="/banners">
      <BannerForm
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
          navigate("/banners");
        }}
        onCancel={() => navigate("/banners")}
      />
    </FormPageShell>
  );
}

export function BannerEditPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { bannerId } = useParams<{ bannerId: string }>();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: fetchAdminBanners,
  });
  const banner = data?.find((item) => item.id === bannerId);

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (!banner) {
    return (
      <FormPageShell title={t("banners.editTitle")} backTo="/banners">
        <Typography variant="body2" color="text.secondary">
          {t("banners.loadFailed")}
        </Typography>
      </FormPageShell>
    );
  }

  return (
    <FormPageShell title={t("banners.editTitle")} subtitle={t("banners.editDescription")} backTo="/banners">
      <BannerForm
        banner={banner}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
          navigate("/banners");
        }}
        onCancel={() => navigate("/banners")}
      />
    </FormPageShell>
  );
}
