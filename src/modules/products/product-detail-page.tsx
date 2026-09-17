import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Edit } from "@mui/icons-material";
import { Box, Button, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { DetailField, DetailGrid, DetailPageShell, EmptyState } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { reviewProductApi } from "../../services/admin-api";
import { fetchProductById } from "../../services/products-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import {
  categoryLabel,
  invalidateProductQueries,
  sortedProductImages,
  statusChipColor,
} from "./product-shared";

type Props = {
  backTo?: string;
  allowModerate?: boolean;
};

export function ProductDetailPage({ backTo = "/products", allowModerate = true }: Props) {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [rejectNote, setRejectNote] = useState("");

  const { data: product, isLoading, isError, error } = useQuery({
    queryKey: ["product-details", id],
    queryFn: () => fetchProductById(id!),
    enabled: Boolean(id),
  });

  const invalidate = () => invalidateProductQueries(queryClient);

  const approveMutation = useMutation({
    mutationFn: () => reviewProductApi(id!, { action: "APPROVE" }),
    onSuccess: invalidate,
  });
  const rejectMutation = useMutation({
    mutationFn: (adminNote?: string) =>
      reviewProductApi(id!, { action: "REJECT", adminNote: adminNote || t("products.defaultRejectNote") }),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError || !product) {
    return (
      <EmptyState
        title={t("products.loadFailed")}
        description={(error as Error)?.message || t("products.noResults")}
      />
    );
  }

  const statusLabel = t(`products.status.${product.status}` as "products.status.PENDING");
  const canModerate = allowModerate && product.status === "PENDING";
  const images = sortedProductImages(product);

  return (
    <DetailPageShell
      title={product.title}
      subtitle={categoryLabel(product, language)}
      backTo={backTo}
      status={
        <Chip size="small" label={statusLabel} color={statusChipColor(product.status)} variant="outlined" />
      }
      actions={
        <>
          <Button
            variant="outlined"
            startIcon={<Edit fontSize="small" />}
            onClick={() => navigate(`/products/${product.id}/edit`)}
          >
            {t("products.form.editTitle")}
          </Button>
          {canModerate ? (
            <>
              <Button
                variant="contained"
                color="success"
                disabled={approveMutation.isPending}
                onClick={() => approveMutation.mutate()}
              >
                {t("products.approve")}
              </Button>
              <Button
                variant="outlined"
                color="error"
                disabled={rejectMutation.isPending}
                onClick={() =>
                  rejectMutation.mutate(rejectNote.trim() || t("products.defaultRejectNote"))
                }
              >
                {t("products.reject")}
              </Button>
            </>
          ) : null}
        </>
      }
      sections={[
        {
          title: t("products.detailsTitle"),
          content: (
            <Stack spacing={2.5}>
              {images.length ? (
                <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                  {images.map((img) => (
                    <Box
                      key={img.id}
                      component="img"
                      src={resolveAssetUrl(img.path)}
                      alt=""
                      sx={{ height: 96, width: 96, borderRadius: "8px", objectFit: "cover", border: 1, borderColor: "divider" }}
                    />
                  ))}
                </Stack>
              ) : null}
              <DetailGrid>
                <DetailField label={t("products.field.title")} value={product.title} />
                <DetailField label={t("products.field.category")} value={categoryLabel(product, language)} />
                <DetailField
                  label={t("products.field.owner")}
                  value={product.company?.name || product.user?.name || t("products.globalOwner")}
                />
                <DetailField label={t("products.field.status")} value={statusLabel} />
                <DetailField
                  label={t("products.field.price")}
                  value={product.price ? `${t("market.currency")} ${product.price}` : "-"}
                />
                <DetailField label={t("products.field.location")} value={product.city || "-"} />
                <DetailField
                  label={t("products.field.created")}
                  value={new Date(product.createdAt).toLocaleString(locale)}
                />
              </DetailGrid>
              <DetailField label={t("products.field.description")} value={product.description || "-"} />
              {canModerate ? (
                <TextField
                  size="small"
                  fullWidth
                  placeholder={t("products.rejectNote")}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                />
              ) : null}
            </Stack>
          ),
        },
      ]}
    />
  );
}

export function PendingProductDetailPage() {
  return <ProductDetailPage backTo="/pending-products" allowModerate />;
}
