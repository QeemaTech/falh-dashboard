import { useMemo, useState } from "react";
import { Autocomplete, CircularProgress, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import type { AdminCompany, AdminProduct } from "../../services/admin-api";
import { BannerCompanyPicker } from "./banner-company-picker";

export type BannerTargetType = "company" | "product" | "url";

type Props = {
  targetType: BannerTargetType;
  onTargetType: (value: BannerTargetType) => void;
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
  targetType,
  onTargetType,
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

  return (
    <Stack spacing={1.5}>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>
        {t("banners.fieldTarget")}
      </Typography>
      <ToggleButtonGroup
        exclusive
        fullWidth
        size="small"
        value={targetType}
        onChange={(_event, value: BannerTargetType | null) => {
          if (value) onTargetType(value);
        }}
      >
        <ToggleButton value="company" sx={{ textTransform: "none" }}>
          {t("banners.linkCompany")}
        </ToggleButton>
        <ToggleButton value="product" sx={{ textTransform: "none" }}>
          {t("banners.linkProduct")}
        </ToggleButton>
        <ToggleButton value="url" sx={{ textTransform: "none" }}>
          {t("banners.linkUrl")}
        </ToggleButton>
      </ToggleButtonGroup>
      <Typography variant="caption" color="text.secondary">
        {t("banners.fieldTargetHint")}
      </Typography>

      {targetType === "company" ? (
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

      {targetType === "product" ? (
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

      {targetType === "url" ? (
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
