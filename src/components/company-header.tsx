import { Header } from "./header";
import { useI18n } from "../hooks/use-i18n";

export function CompanyHeader() {
  const { t } = useI18n();

  return (
    <Header
      homeTo="/company"
      searchPlaceholder={t("company.search.placeholder")}
      notificationViewAllPath="/company/notifications"
    />
  );
}
