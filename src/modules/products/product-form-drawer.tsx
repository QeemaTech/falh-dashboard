import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AddLocationAlt, Clear, LocationOn } from "@mui/icons-material";
import { AppDrawer } from "../../components/design-system";
import { LocationPickerDialog } from "../../components/location/location-picker-dialog";
import { governorateOptions } from "../../constants/egypt-governorates";
import { useI18n } from "../../hooks/use-i18n";
import {
  createAdminProductApi,
  fetchAdminCategories,
  fetchAdminCompanies,
  fetchCategoryDynamicFields,
  updateAdminProductApi,
  uploadAdminProductImagesApi,
  type AdminProduct,
  type ProductFormPayload,
} from "../../services/admin-api";
import {
  createCompanyProductApi,
  fetchCategoryFormFields,
  fetchProductById,
  fetchProductCategories,
  updateCompanyProductApi,
  uploadCompanyProductImagesApi,
} from "../../services/products-api";
import { getApiErrorMessage } from "../../utils/api-error";
import {
  ProductImagePicker,
  productImagesToItems,
  resolveProductImagePaths,
  type ProductImageItem,
} from "./product-image-picker";
import { ProductDynamicFieldsForm } from "./product-dynamic-fields-form";
import {
  buildDynamicFieldsPayload,
  fieldValuesToMap,
  validateDynamicFieldValues,
  type DynamicFieldValuesMap,
} from "./product-dynamic-fields-utils";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scope: "admin" | "company";
  product?: AdminProduct | null;
  canAdd?: boolean;
};

export function ProductFormDrawer({ open, onClose, onSuccess, scope, product, canAdd = true }: Props) {
  const { t, language, isArabic } = useI18n();
  const isEdit = Boolean(product);
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [descriptionEn, setDescriptionEn] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState(0);
  const [city, setCity] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [target, setTarget] = useState<"LOCAL" | "EXPORT" | "">("");
  const [imageItems, setImageItems] = useState<ProductImageItem[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [publishActive, setPublishActive] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [dynamicValues, setDynamicValues] = useState<DynamicFieldValuesMap>({});
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousCategoryId = useRef("");

  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories", scope],
    queryFn: () => (scope === "admin" ? fetchAdminCategories() : fetchProductCategories()),
    enabled: open,
  });

  const { data: productDetails } = useQuery({
    queryKey: ["product-details", product?.id],
    queryFn: () => fetchProductById(product!.id),
    enabled: open && isEdit && Boolean(product?.id),
  });

  const effectiveProduct = productDetails || product;

  const { data: categoryFields = [], isLoading: categoryFieldsLoading } = useQuery({
    queryKey: ["category-form-fields", categoryId, scope],
    queryFn: () =>
      scope === "admin" ? fetchCategoryDynamicFields(categoryId, false) : fetchCategoryFormFields(categoryId),
    enabled: open && Boolean(categoryId),
  });
  const { data: companiesData } = useQuery({
    queryKey: ["admin-companies-select"],
    queryFn: () => fetchAdminCompanies({ page: 1, limit: 100, status: "APPROVED" }),
    enabled: open && scope === "admin" && !isEdit,
  });

  useEffect(() => {
    if (!open) return;
    setError(null);
    const source = effectiveProduct || product;
    if (source) {
      setTitleAr(source.titleAr || source.title);
      setTitleEn(source.titleEn || "");
      setDescriptionAr(source.descriptionAr || source.description || "");
      setDescriptionEn(source.descriptionEn || "");
      setCategoryId(source.category?.id || "");
      setPrice(source.price || 0);
      setTarget((source.target as "LOCAL" | "EXPORT") || "");
      setCity(source.city || "");
      setLatInput(source.lat !== undefined && source.lat !== null ? String(source.lat) : "");
      setLngInput(source.lng !== undefined && source.lng !== null ? String(source.lng) : "");
      setImageItems(productImagesToItems(source));
      setCompanyId(source.company?.id || "");
      setPublishActive(source.status === "ACTIVE");
      setSaveAsDraft(source.status === "DRAFT");
    } else {
      setTitleAr("");
      setTitleEn("");
      setDescriptionAr("");
      setDescriptionEn("");
      setCategoryId("");
      setPrice(0);
      setCity("");
      setLatInput("");
      setLngInput("");
      setTarget("");
      setImageItems([]);
      setCompanyId("");
      setPublishActive(true);
      setSaveAsDraft(false);
      setDynamicValues({});
    }
    previousCategoryId.current = source?.category?.id || "";
  }, [open, product, effectiveProduct]);

  useEffect(() => {
    if (!open || !effectiveProduct?.fieldValues?.length) return;
    setDynamicValues(fieldValuesToMap(effectiveProduct.fieldValues));
  }, [open, effectiveProduct?.fieldValues, effectiveProduct?.id]);

  useEffect(() => {
    if (!open || isEdit) return;
    if (previousCategoryId.current && previousCategoryId.current !== categoryId) {
      setDynamicValues({});
    }
    previousCategoryId.current = categoryId;
  }, [categoryId, open, isEdit]);

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.id === categoryId),
    [categories, categoryId]
  );
  const requiresGovernorate = selectedCategory?.requiresGovernorate === true;
  const governorateOpts = useMemo(() => governorateOptions(language), [language]);
  const citySelectValue = requiresGovernorate
    ? governorateOpts.find((option) => option.value === city || option.label === city)?.value ?? ""
    : city;

  const categoryName = (cat: { nameAr?: string; nameEn?: string; id: string }) =>
    language === "ar" ? cat.nameAr || cat.nameEn || cat.id : cat.nameEn || cat.nameAr || cat.id;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!titleAr.trim() || titleAr.trim().length < 2) throw new Error(t("products.form.errorTitle"));
      if (!descriptionAr.trim() || descriptionAr.trim().length < 5) {
        throw new Error(t("products.form.errorDescription"));
      }
      if (!categoryId) throw new Error(t("products.form.errorCategory"));
      if (Number.isNaN(Number(price)) || Number(price) < 0) {
        throw new Error(t("products.form.errorPrice"));
      }

      const uploadImages = scope === "admin" ? uploadAdminProductImagesApi : uploadCompanyProductImagesApi;
      const images = await resolveProductImagePaths(imageItems, uploadImages);

      validateDynamicFieldValues(
        categoryFields,
        dynamicValues,
        language,
        (label) => t("products.form.fieldRequired").replace("{{label}}", label)
      );

      const parsedLat = latInput.trim() !== "" && !Number.isNaN(Number(latInput)) ? Number(latInput) : undefined;
      const parsedLng = lngInput.trim() !== "" && !Number.isNaN(Number(lngInput)) ? Number(lngInput) : undefined;

      const payload: ProductFormPayload = {
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim() || titleAr.trim(),
        descriptionAr: descriptionAr.trim(),
        descriptionEn: descriptionEn.trim() || descriptionAr.trim(),
        categoryId,
        price: Number(price),
        city: requiresGovernorate ? (city || undefined) : undefined,
        lat: parsedLat,
        lng: parsedLng,
        target: target ? target : null,
        images,
        dynamicFields: buildDynamicFieldsPayload(categoryFields, dynamicValues),
      };

      if (scope === "admin") {
        if (isEdit && product) {
          return updateAdminProductApi(product.id, {
            ...payload,
            publishActive,
            submitForReview: !publishActive,
          });
        }
        return createAdminProductApi({
          ...payload,
          companyId: companyId || undefined,
          publishActive,
        });
      }

      if (!canAdd && !isEdit && !saveAsDraft) {
        throw new Error(t("products.form.errorQuota"));
      }

      if (isEdit && product) {
        return updateCompanyProductApi(product.id, {
          ...payload,
          isDraft: saveAsDraft,
          submit: !saveAsDraft,
        });
      }
      return createCompanyProductApi({ ...payload, isDraft: saveAsDraft });
    },
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, t("products.form.saveFailed"))),
  });

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? t("products.form.editTitle") : t("products.form.addTitle")}
      footer={
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            disabled={saveMutation.isPending || (!canAdd && scope === "company" && !isEdit && !saveAsDraft)}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending
              ? t("products.form.saving")
              : isEdit
                ? t("products.form.save")
                : t("products.form.create")}
          </Button>
          <Button onClick={onClose}>{t("products.cancel")}</Button>
        </Stack>
      }
    >
      <Stack spacing={2}>
        {error ? (
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        ) : null}
        <TextField
          size="small"
          fullWidth
          label={t("products.form.titleAr")}
          value={titleAr}
          onChange={(e) => setTitleAr(e.target.value)}
        />
        <TextField
          size="small"
          fullWidth
          label={t("products.form.titleEn")}
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
        />
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={2}
          label={t("products.form.descriptionAr")}
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
        />
        <TextField
          size="small"
          fullWidth
          multiline
          minRows={2}
          label={t("products.form.descriptionEn")}
          value={descriptionEn}
          onChange={(e) => setDescriptionEn(e.target.value)}
        />
        <TextField
          select
          size="small"
          fullWidth
          label={t("products.form.category")}
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <MenuItem value="">{t("products.form.selectCategory")}</MenuItem>
          {categories.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {categoryName(cat)}
            </MenuItem>
          ))}
        </TextField>
        {categoryId && categoryFieldsLoading ? (
          <Typography variant="body2" color="text.secondary">
            {t("products.form.loadingFields")}
          </Typography>
        ) : null}
        {categoryId && !categoryFieldsLoading ? (
          <ProductDynamicFieldsForm
            fields={categoryFields}
            values={dynamicValues}
            onChange={setDynamicValues}
            language={language}
            disabled={saveMutation.isPending}
            onUploadFile={async (file) => {
              const upload = scope === "admin" ? uploadAdminProductImagesApi : uploadCompanyProductImagesApi;
              const paths = await upload([file]);
              return paths[0] || "";
            }}
            t={t}
          />
        ) : null}
        <TextField
          size="small"
          fullWidth
          type="number"
          label={t("products.form.price")}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        {requiresGovernorate ? (
          <TextField
            select
            size="small"
            fullWidth
            label={t("products.form.city")}
            value={citySelectValue}
            onChange={(e) => {
              const selected = governorateOpts.find((option) => option.value === e.target.value);
              setCity(selected?.label ?? e.target.value);
            }}
          >
            <MenuItem value="">{t("categories.fields.select")}</MenuItem>
            {governorateOpts.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        ) : null}

        <TextField
          select
          size="small"
          fullWidth
          label={t("products.form.target")}
          value={target}
          onChange={(e) => setTarget(e.target.value as "LOCAL" | "EXPORT" | "")}
        >
          <MenuItem value="">{t("products.form.targetNone")}</MenuItem>
          <MenuItem value="LOCAL">{t("products.form.targetLocal")}</MenuItem>
          <MenuItem value="EXPORT">{t("products.form.targetExport")}</MenuItem>
        </TextField>

        {latInput && lngInput ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Button
              fullWidth
              size="small"
              variant="outlined"
              color="success"
              startIcon={<LocationOn />}
              onClick={() => setIsMapOpen(true)}
            >
              {isArabic
                ? `الموقع المحدد: (${latInput}, ${lngInput})`
                : `Location Set: (${latInput}, ${lngInput})`}
            </Button>
            <IconButton
              size="small"
              color="error"
              onClick={() => {
                setLatInput("");
                setLngInput("");
              }}
              title={isArabic ? "مسح الموقع" : "Clear location"}
            >
              <Clear />
            </IconButton>
          </Stack>
        ) : (
          <Button
            fullWidth
            size="small"
            variant="outlined"
            startIcon={<AddLocationAlt />}
            onClick={() => setIsMapOpen(true)}
          >
            {isArabic ? "تحديد الموقع على الخريطة (اختياري)" : "Select Location on Map (Optional)"}
          </Button>
        )}
        <ProductImagePicker
          items={imageItems}
          onChange={setImageItems}
          label={t("products.form.images")}
          hint={t("products.form.uploadImagesHint")}
          addLabel={t("products.form.addImages")}
          disabled={saveMutation.isPending}
        />
        {scope === "admin" && !isEdit ? (
          <TextField
            select
            size="small"
            fullWidth
            label={t("products.form.ownerCompany")}
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
          >
            <MenuItem value="">{t("products.form.globalOwner")}</MenuItem>
            {(companiesData?.items || []).map((company) => (
              <MenuItem key={company.id} value={company.id}>
                {company.name}
              </MenuItem>
            ))}
          </TextField>
        ) : null}
        {scope === "admin" ? (
          <FormControlLabel
            control={<Checkbox checked={publishActive} onChange={(e) => setPublishActive(e.target.checked)} />}
            label={t("products.form.publishActive")}
          />
        ) : (
          <FormControlLabel
            control={<Checkbox checked={saveAsDraft} onChange={(e) => setSaveAsDraft(e.target.checked)} />}
            label={t("products.form.saveDraft")}
          />
        )}
      </Stack>

      <LocationPickerDialog
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialLat={latInput ? Number(latInput) : undefined}
        initialLng={lngInput ? Number(lngInput) : undefined}
        onSelect={(coords) => {
          if (coords) {
            setLatInput(String(coords.lat));
            setLngInput(String(coords.lng));
          } else {
            setLatInput("");
            setLngInput("");
          }
        }}
      />
    </AppDrawer>
  );
}
