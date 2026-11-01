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
  const { t, isArabic } = useI18n();
  const isEdit = Boolean(product);

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? t("products.form.editTitle") : t("products.form.addTitle")}
      description={
        isEdit
          ? isArabic
            ? "قم بتعديل بيانات ومواصفات وصور المنتج"
            : "Update product details, specs, and photos"
          : isArabic
            ? "أضف منتجاً جديداً مع تحديد التصنيف والبيانات والصور"
            : "Add a new product with category details and photos"
      }
      width={{ xs: "100vw", sm: "94vw", md: 780, lg: 880 }}
    >
      <ProductForm
        scope={scope}
        product={product}
        canAdd={canAdd}
        active={open}
        inDrawer={true}
        onSuccess={() => {
          onSuccess();
          onClose();
        }}
        onCancel={onClose}
      />
    </AppDrawer>
  );
}
