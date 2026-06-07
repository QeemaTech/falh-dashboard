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
          borderRadius: 1,
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
        borderRadius: 1,
        objectFit: "cover",
        flexShrink: 0,
        border: 1,
        borderColor: "divider",
      }}
    />
  );
}

function productActionsGridColumns(language: "ar" | "en", includeEditDelete: boolean) {
  const moderateCol = language === "ar" ? "68px" : "64px";
  if (includeEditDelete) {
    return `32px ${moderateCol} ${moderateCol} 32px 32px`;
  }
  return `32px ${moderateCol} ${moderateCol}`;
}

const actionBtnSx = {
  width: "100%",
  minWidth: 0,
  justifySelf: "stretch",
  whiteSpace: "nowrap",
  px: 0.75,
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

export function ProductRowActions({
  product,
  language,
  t,
  onView,
  onApprove,
  onReject,
  onEdit,
  onDelete,
  approvePending,
  rejectPending,
}: ProductRowActionsProps) {
  const includeEditDelete = Boolean(onEdit || onDelete);
  const moderatable = canModerate(product.status);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: productActionsGridColumns(language, includeEditDelete),
        columnGap: 0.75,
        alignItems: "center",
        width: "max-content",
      }}
    >
      <Tooltip title={t("products.view")}>
        <IconButton size="small" onClick={onView}>
          <Visibility fontSize="small" />
        </IconButton>
      </Tooltip>
      <Button
        size="small"
        variant="outlined"
        color="success"
        disabled={!moderatable || approvePending}
        sx={actionBtnSx}
        onClick={onApprove}
      >
        {t("products.approve")}
      </Button>
      <Button
        size="small"
        variant="outlined"
        color="error"
        disabled={!moderatable || rejectPending}
        sx={actionBtnSx}
        onClick={onReject}
      >
        {t("products.reject")}
      </Button>
      {onEdit ? (
        <Tooltip title={t("products.edit")}>
          <IconButton size="small" onClick={onEdit}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : null}
      {onDelete ? (
        <Tooltip title={t("products.delete")}>
          <IconButton size="small" color="error" onClick={onDelete}>
            <Delete fontSize="small" />
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
