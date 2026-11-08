import { useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  CircularProgress,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { AdminCompany, AdminProduct } from "../../services/admin-api";
import { BannerCompanyPicker } from "./banner-company-picker";

export type BannerTargetType = "company" | "product" | "url";

type Props = {
  selectedTargets: BannerTargetType[];
  onSelectedTargets: (targets: BannerTargetType[]) => void;
  companyId: string;
  onCompanyId: (companyId: string) => void;
  productId: string;
  onProductId: (productId: string) => void;
  externalUrl: string;
  onExternalUrl: (url: string) => void;
  companies: AdminCompany[];
  companiesLoading?: boolean;
  products: AdminProduct[];
  productsLoading?: boolean;
  t: (key: string) => string;
};

function productLabel(product: AdminProduct) {
  return product.titleAr || product.title || product.titleEn || product.id;
}

export function BannerTargetFields({
  selectedTargets,
  onSelectedTargets,
  companyId,
  onCompanyId,
  productId,
  onProductId,
  externalUrl,
  onExternalUrl,
  companies,
  companiesLoading,
  products,
  productsLoading,
  t,
}: Props) {
  const [productQuery, setProductQuery] = useState("");
  const selectedProduct = useMemo(
    () => products.find((product) => product.id === productId) || null,
    [products, productId]
  );

  const hasCompany = selectedTargets.includes("company");
  const hasProduct = selectedTargets.includes("product");
  const hasUrl = selectedTargets.includes("url");

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
          {t("banners.fieldTargetsSection")}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {t("banners.fieldTargetHint")}
        </Typography>
      </Box>

      <ToggleButtonGroup
        fullWidth
        size="small"
        value={selectedTargets}
        onChange={(_event, values: BannerTargetType[]) => {
          onSelectedTargets(values || []);
        }}
      >
        <ToggleButton value="company" sx={{ textTransform: "none", fontWeight: hasCompany ? 600 : 400 }}>
          {t("banners.linkCompany")}
        </ToggleButton>
        <ToggleButton value="product" sx={{ textTransform: "none", fontWeight: hasProduct ? 600 : 400 }}>
          {t("banners.linkProduct")}
        </ToggleButton>
        <ToggleButton value="url" sx={{ textTransform: "none", fontWeight: hasUrl ? 600 : 400 }}>
          {t("banners.linkUrl")}
        </ToggleButton>
      </ToggleButtonGroup>

      {hasCompany ? (
        <BannerCompanyPicker
          companies={companies}
          loading={companiesLoading}
          selectedCompanyId={companyId}
          onSelect={onCompanyId}
          label={t("banners.fieldCompany")}
          hint={t("banners.fieldCompanyHint")}
          searchPlaceholder={t("banners.fieldCompanySearch")}
          emptyLabel={t("banners.fieldCompanyEmpty")}
        />
      ) : null}

      {hasProduct ? (
        <Autocomplete
          options={products}
          loading={productsLoading}
          value={selectedProduct}
          inputValue={productQuery}
          onInputChange={(_event, value) => setProductQuery(value)}
          onChange={(_event, product) => onProductId(product?.id || "")}
          getOptionLabel={productLabel}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          noOptionsText={t("banners.fieldProductEmpty")}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label={t("banners.fieldProduct")}
              placeholder={t("banners.fieldProductSearch")}
              helperText={t("banners.fieldProductHint")}
              slotProps={{
                ...params.slotProps,
                input: {
                  ...params.slotProps?.input,
                  endAdornment: (
                    <>
                      {productsLoading ? <CircularProgress color="inherit" size={16} /> : null}
                      {params.slotProps?.input?.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
        />
      ) : null}

      {hasUrl ? (
        <TextField
          size="small"
          fullWidth
          label={t("banners.fieldExternalUrl")}
          placeholder="https://"
          value={externalUrl}
          onChange={(event) => onExternalUrl(event.target.value)}
          helperText={t("banners.fieldExternalUrlHint")}
        />
      ) : null}
    </Stack>
  );
}
