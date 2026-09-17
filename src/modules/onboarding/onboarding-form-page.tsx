import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FormPageShell } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { OnboardingForm } from "./onboarding-form";

export function OnboardingCreatePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <FormPageShell
      title={t("onboarding.addTitle")}
      subtitle={t("onboarding.addDescription")}
      backTo="/onboarding"
    >
      <OnboardingForm
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-onboarding-slides"] });
          navigate("/onboarding");
        }}
        onCancel={() => navigate("/onboarding")}
      />
    </FormPageShell>
  );
}
