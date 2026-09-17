import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BusinessOutlined,
  CalendarMonthOutlined,
  Edit,
  ImageOutlined,
  Inventory2Outlined,
  LocationOnOutlined,
  PaymentsOutlined,
} from "@mui/icons-material";
import { Box, Button, Chip, CircularProgress, Stack, TextField, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import {
  DetailBackButton,
  DetailHero,
  DetailMediaFrame,
  DetailTwoColumn,
  EmptyState,
  InfoRow,
  MetaItem,
  MetricTile,
  MetricsRow,
  SectionCard,
} from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { reviewProductApi } from "../../services/admin-api";
import { fetchProductById } from "../../services/products-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import {
  categoryLabel,
  invalidateProductQueries,
  primaryProductImagePath,
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
  const [coverFailed, setCoverFailed] = useState(false);

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
      reviewProductApi(id!, {
        action: "REJECT",
        adminNote: adminNote || t("products.defaultRejectNote"),
      }),
    onSuccess: invalidate,
  });

  if (isLoading) {
    return (
      <Stack sx={{ py: 8, alignItems: "center" }}>
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
  const coverPath = primaryProductImagePath(product);
  const owner = product.company?.name || product.user?.name || t("products.globalOwner");
  const category = categoryLabel(product, language);
  const priceLabel = product.price
    ? `${t("market.currency")} ${Number(product.price).toLocaleString(locale)}`
    : "—";

  return (
    <Stack spacing={2.5} sx={{ width: "100%", pb: 2 }}>
      <DetailBackButton to={backTo} />

      <DetailHero
        media={
          <DetailMediaFrame size={{ xs: 88, md: 108 }}>
            {coverPath && !coverFailed ? (
              <Box
                component="img"
                src={resolveAssetUrl(coverPath)}
                alt={product.title}
                onError={() => setCoverFailed(true)}
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <ImageOutlined sx={{ fontSize: 36, color: "text.disabled" }} />
            )}
          </DetailMediaFrame>
        }
        title={product.title}
        status={
          <Chip
            size="small"
            label={statusLabel}
            color={statusChipColor(product.status)}
            variant="outlined"
            sx={{ borderRadius: "8px", fontWeight: 700 }}
          />
        }
        meta={
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
            <MetaItem icon={<Inventory2Outlined sx={{ fontSize: 16 }} />}>{category}</MetaItem>
            <MetaItem icon={<BusinessOutlined sx={{ fontSize: 16 }} />}>{owner}</MetaItem>
            {product.city ? (
              <MetaItem icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}>{product.city}</MetaItem>
            ) : null}
          </Stack>
        }
        actions={
          <>
            <Button
              variant="outlined"
              startIcon={<Edit fontSize="small" />}
              onClick={() => navigate(`/products/${product.id}/edit`)}
              sx={{ borderRadius: "8px" }}
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
                  sx={{ borderRadius: "8px" }}
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
                  sx={{ borderRadius: "8px" }}
                >
                  {t("products.reject")}
                </Button>
              </>
            ) : null}
          </>
        }
      />

      <MetricsRow>
        <MetricTile
          label={t("products.field.price")}
          value={priceLabel}
          icon={<PaymentsOutlined fontSize="small" />}
        />
        <MetricTile
          label={t("products.field.category")}
          value={category}
          icon={<Inventory2Outlined fontSize="small" />}
        />
        <MetricTile
          label={t("products.field.location")}
          value={product.city || "—"}
          icon={<LocationOnOutlined fontSize="small" />}
        />
        <MetricTile
          label={t("products.field.created")}
          value={new Date(product.createdAt).toLocaleDateString(locale)}
          icon={<CalendarMonthOutlined fontSize="small" />}
        />
      </MetricsRow>

      <DetailTwoColumn
        main={
          <>
            <SectionCard title={t("products.detailsTitle")}>
              <InfoRow label={t("products.field.title")} value={product.title} />
              <InfoRow label={t("products.field.category")} value={category} />
              <InfoRow label={t("products.field.owner")} value={owner} />
              <InfoRow label={t("products.field.status")} value={statusLabel} />
              <InfoRow label={t("products.field.price")} value={priceLabel} />
              <InfoRow label={t("products.field.location")} value={product.city || "—"} />
              {product.quantity != null ? (
                <InfoRow
                  label={t("products.field.quantity", "Quantity")}
                  value={`${product.quantity}${product.unit ? ` ${product.unit}` : ""}`}
                />
              ) : null}
              {product.contactPhone ? (
                <InfoRow label={t("products.field.phone", "Phone")} value={product.contactPhone} />
              ) : null}
              <InfoRow
                label={t("products.field.created")}
                value={new Date(product.createdAt).toLocaleString(locale)}
              />
              {product.description ? (
                <Box sx={{ pt: 1.5 }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.75 }}>
                    {t("products.field.description")}
                  </Typography>
                  <Typography variant="body2" sx={{ lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                    {product.description}
                  </Typography>
                </Box>
              ) : null}
            </SectionCard>

            {images.length ? (
              <SectionCard title={t("products.field.images", "Images")}>
                <Box
                  sx={{
                    display: "grid",
                    gap: 1.5,
                    gridTemplateColumns: {
                      xs: "repeat(2, minmax(0, 1fr))",
                      sm: "repeat(3, minmax(0, 1fr))",
                      md: "repeat(4, minmax(0, 1fr))",
                    },
                  }}
                >
                  {images.map((img) => (
                    <Box
                      key={img.id}
                      component="img"
                      src={resolveAssetUrl(img.path)}
                      alt=""
                      sx={{
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: "8px",
                        objectFit: "cover",
                        border: 1,
                        borderColor: "divider",
                        bgcolor: "action.hover",
                      }}
                    />
                  ))}
                </Box>
              </SectionCard>
            ) : null}
          </>
        }
        side={
          canModerate ? (
            <SectionCard title={t("products.rejectNote", "Reject note")}>
              <Stack spacing={2}>
                <TextField
                  size="small"
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder={t("products.rejectNote")}
                  value={rejectNote}
                  onChange={(e) => setRejectNote(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                />
                <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <Button
                    variant="contained"
                    color="success"
                    disabled={approveMutation.isPending}
                    onClick={() => approveMutation.mutate()}
                    sx={{ borderRadius: "8px" }}
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
                    sx={{ borderRadius: "8px" }}
                  >
                    {t("products.reject")}
                  </Button>
                </Stack>
              </Stack>
            </SectionCard>
          ) : undefined
        }
      />
    </Stack>
  );
}

export function PendingProductDetailPage() {
  return <ProductDetailPage backTo="/pending-products" allowModerate />;
}
