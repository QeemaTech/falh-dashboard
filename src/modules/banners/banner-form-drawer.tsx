import { AppDrawer } from "../../components/design-system";
import { useI18n } from "../../hooks/use-i18n";
import { BannerForm } from "./banner-form";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function BannerFormDrawer({ open, onClose, onSuccess }: Props) {
  const { t } = useI18n();

  return (
    <AppDrawer open={open} onClose={onClose} title={t("banners.addTitle")} width={560}>
      <BannerForm
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
        onCancel={onClose}
      />
    </AppDrawer>
  );
}
