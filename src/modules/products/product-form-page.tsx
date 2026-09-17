import { CircularProgress, Stack } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { FormPageShell } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { invalidateProductQueries } from "./product-shared";
import { ProductForm } from "./product-form";

export function ProductCreatePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return (
    <FormPageShell
      title={t("products.form.addTitle")}
      subtitle={t("products.subtitle")}
      backTo="/products"
    >
      <ProductForm
        scope="admin"
        onSuccess={() => {
          invalidateProductQueries(queryClient);
          navigate("/products");
        }}
        onCancel={() => navigate("/products")}
      />
    </FormPageShell>
  );
}

export function ProductEditPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  if (!id) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  return (
    <FormPageShell
      title={t("products.form.editTitle")}
      subtitle={t("products.subtitle")}
      backTo={`/products/${id}`}
    >
      <ProductForm
        scope="admin"
        productId={id}
        onSuccess={() => {
          invalidateProductQueries(queryClient);
          navigate(`/products/${id}`);
        }}
        onCancel={() => navigate(`/products/${id}`)}
      />
    </FormPageShell>
  );
}
