import { AppDrawer } from "../../components/design-system";
import { useI18n } from "../../hooks/use-i18n";
import type { AdminProduct } from "../../services/admin-api";
import { ProductForm } from "./product-form";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scope: "admin" | "company";
  product?: AdminProduct | null;
  canAdd?: boolean;
};

export function ProductFormDrawer({ open, onClose, onSuccess, scope, product, canAdd = true }: Props) {
  const { t } = useI18n();
  const isEdit = Boolean(product);

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? t("products.form.editTitle") : t("products.form.addTitle")}
    >
      <ProductForm
        scope={scope}
        product={product}
        canAdd={canAdd}
        active={open}
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
        onCancel={onClose}
      />
    </AppDrawer>
  );
}
