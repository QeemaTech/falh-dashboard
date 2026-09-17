import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FormPageShell } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
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
