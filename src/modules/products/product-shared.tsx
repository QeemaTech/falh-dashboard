import { useState } from "react";
import { Delete, Edit, ImageOutlined, Visibility } from "@mui/icons-material";
import { Box, Button, IconButton, Tooltip } from "@mui/material";
import type { AdminProduct } from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";

export function categoryLabel(product: AdminProduct, language: "ar" | "en") {
  const cat = product.category;
  if (!cat) return "-";
  return language === "ar" ? cat.nameAr || cat.nameEn || "-" : cat.nameEn || cat.nameAr || "-";
}

export function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "ACTIVE") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED") return "error";
  return "default";
}

export function canModerate(status: string) {
  return status === "PENDING";
}

export function sortedProductImages(product: AdminProduct) {
  return [...(product.images || [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
}

export function primaryProductImagePath(product: AdminProduct) {
  return sortedProductImages(product)[0]?.path;
}

type ProductImageThumbProps = {
  product: AdminProduct;
  size?: number;
};

export function ProductImageThumb({ product, size = 48 }: ProductImageThumbProps) {
  const path = primaryProductImagePath(product);
  const [failed, setFailed] = useState(false);

  if (!path || failed) {
    return (
      <Box
        sx={{
          height: size,
          width: size,
          borderRadius: "8px",
          bgcolor: "action.hover",
          display: "grid",
          placeItems: "center",
          color: "text.disabled",
          flexShrink: 0,
        }}
      >
        <ImageOutlined sx={{ fontSize: size * 0.45 }} />
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={resolveAssetUrl(path)}
      alt={product.title}
      onError={() => setFailed(true)}
      sx={{
        height: size,
        width: size,
        borderRadius: "8px",
        objectFit: "cover",
        flexShrink: 0,
        border: 1,
        borderColor: "divider",
      }}
    />
  );
}

const actionBtnSx = {
  minWidth: 0,
  whiteSpace: "nowrap",
  px: 1,
  borderRadius: "8px",
} as const;

type ProductRowActionsProps = {
  product: AdminProduct;
  language: "ar" | "en";
  t: (key: string) => string;
  onView: () => void;
  onApprove: () => void;
  onReject: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  approvePending?: boolean;
  rejectPending?: boolean;
};

const actionIconSx = {
  borderRadius: "8px",
  border: "1px solid",
  borderColor: "divider",
  width: 34,
  height: 34,
  bgcolor: "background.paper",
} as const;

export function ProductRowActions({
  product,
  t,
  onView,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  approvePending,
  rejectPending,
}: ProductRowActionsProps) {
  const moderatable = canModerate(product.status);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "nowrap",
        gap: 0.75,
        alignItems: "center",
        width: "max-content",
      }}
    >
      <Tooltip title={t("products.view")}>
        <IconButton size="small" onClick={onView} aria-label={t("products.view")} sx={actionIconSx}>
          <Visibility sx={{ fontSize: 18 }} />
        </IconButton>
      </Tooltip>
      {onEdit ? (
        <Tooltip title={t("products.edit")}>
          <IconButton
            size="small"
            color="primary"
            onClick={onEdit}
            aria-label={t("products.edit")}
            sx={{ ...actionIconSx, borderColor: "primary.light", color: "primary.main" }}
          >
            <Edit sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ) : null}
      {moderatable ? (
        <>
          <Button
            size="small"
            variant="outlined"
            color="success"
            disabled={approvePending}
            sx={actionBtnSx}
            onClick={onApprove}
          >
            {t("products.approve")}
          </Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            disabled={rejectPending}
            sx={actionBtnSx}
            onClick={onReject}
          >
            {t("products.reject")}
          </Button>
        </>
      ) : null}
      {onDelete ? (
        <Tooltip title={t("products.delete")}>
          <IconButton
            size="small"
            color="error"
            onClick={onDelete}
            aria-label={t("products.delete")}
            sx={{ ...actionIconSx, borderColor: "error.light" }}
          >
            <Delete sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ) : null}
    </Box>
  );
}

export type CompanyProductGroup = {
  key: string;
  companyName: string;
  products: AdminProduct[];
};

export function groupProductsByCompany(
  products: AdminProduct[],
  globalOwnerLabel: string
): CompanyProductGroup[] {
  const groups = new Map<string, CompanyProductGroup>();
  for (const product of products) {
    const key = product.company?.id || "global";
    const companyName = product.company?.name || globalOwnerLabel;
    if (!groups.has(key)) {
      groups.set(key, { key, companyName, products: [] });
    }
    groups.get(key)!.products.push(product);
  }
  return Array.from(groups.values()).sort((a, b) => a.companyName.localeCompare(b.companyName));
}

export function invalidateProductQueries(
  queryClient: { invalidateQueries: (opts: { queryKey: string[] }) => void }
) {
  queryClient.invalidateQueries({ queryKey: ["admin-products-catalog"] });
  queryClient.invalidateQueries({ queryKey: ["admin-pending-products"] });
}
