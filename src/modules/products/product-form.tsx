import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import {
  AddLocationAlt,
  Call,
  CategoryOutlined,
  Clear,
  ContentCopy,
  LocationOn,
  PhoneIphone,
  PhotoCameraOutlined,
  Save,
  SettingsOutlined,
  WhatsApp,
} from "@mui/icons-material";
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
  fetchActiveCenters,
  fetchActiveCities,
  fetchActiveGovernorates,
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

export type ProductFormProps = {
  scope: "admin" | "company";
  product?: AdminProduct | null;
  productId?: string;
  canAdd?: boolean;
  active?: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  showActions?: boolean;
  actionsSlot?: (props: { saving: boolean; onSave: () => void; onCancel: () => void; canSave: boolean }) => ReactNode;
  inDrawer?: boolean;
};

export function ProductForm({
  scope,
  product,
  productId,
  canAdd = true,
  active = true,
  onSuccess,
  onCancel,
  showActions = true,
  actionsSlot,
  inDrawer = false,
}: ProductFormProps) {
  const { t, language, isArabic } = useI18n();
  const resolvedId = productId || product?.id;
  const isEdit = Boolean(resolvedId);
  const [titleAr, setTitleAr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [price, setPrice] = useState("");
  const [originalPrice, setOriginalPrice] = useState("");
  const [advertiserName, setAdvertiserName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [city, setCity] = useState("");
  const [governorateId, setGovernorateId] = useState("");
  const [cityId, setCityId] = useState("");
  const [centerId, setCenterId] = useState("");
  const [latInput, setLatInput] = useState("");
  const [lngInput, setLngInput] = useState("");
  const [imageItems, setImageItems] = useState<ProductImageItem[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [publishActive, setPublishActive] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [dynamicValues, setDynamicValues] = useState<DynamicFieldValuesMap>({});
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previousCategoryId = useRef("");
  const initialized = useRef(false);

  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories", scope],
    queryFn: async () => {
      if (scope === "admin") {
        const result = await fetchAdminCategories({ page: 1, limit: 200, sortBy: "sortOrder", sortOrder: "asc" });
        return result.items;
      }
      return fetchProductCategories();
    },
    enabled: active,
  });

  const { data: productDetails } = useQuery({
    queryKey: ["product-details", resolvedId],
    queryFn: () => fetchProductById(resolvedId!),
    enabled: active && isEdit && Boolean(resolvedId),
  });

  const effectiveProduct = productDetails || product;

  const { data: categoryFields = [], isLoading: categoryFieldsLoading } = useQuery({
    queryKey: ["category-form-fields", categoryId, scope, language],
    queryFn: () =>
      scope === "admin" ? fetchCategoryDynamicFields(categoryId, false) : fetchCategoryFormFields(categoryId),
    enabled: active && Boolean(categoryId),
  });

  const { data: companiesData, isLoading: companiesLoading } = useQuery({
    queryKey: ["admin-companies-select"],
    queryFn: () => fetchAdminCompanies({ page: 1, limit: 200, status: "APPROVED", sortBy: "name", sortOrder: "asc" }),
    enabled: active && scope === "admin" && !isEdit,
  });

  useEffect(() => {
    if (!active) {
      initialized.current = false;
      return;
    }
    setError(null);
    const source = effectiveProduct || product;
    if (isEdit && !source) return;

    if (source) {
      setTitleAr(source.titleAr || source.title);
      setTitleEn(source.titleEn || "");
      setDescriptionAr(source.descriptionAr || source.description || "");
      setPrice(source.price != null ? String(source.price) : "");
      setOriginalPrice(source.originalPrice != null ? String(source.originalPrice) : "");
      setAdvertiserName(source.advertiserName || "");
      setContactPhone(source.contactPhone || "");
      setWhatsappNumber(source.whatsappNumber || "");
      setCategoryId(source.category?.id || "");
      setCity(source.city || "");
      setGovernorateId(
        source.governorateId || source.locationGovernorate?.id || source.locationCity?.governorateId || ""
      );
      setCityId(source.cityId || source.locationCity?.id || "");
      setCenterId(source.centerId || source.locationCenter?.id || "");
      setLatInput(source.lat !== undefined && source.lat !== null ? String(source.lat) : "");
      setLngInput(source.lng !== undefined && source.lng !== null ? String(source.lng) : "");
      setImageItems(productImagesToItems(source));
      setCompanyId(source.company?.id || "");
      setPublishActive(source.status === "ACTIVE");
      setSaveAsDraft(source.status === "DRAFT");
    } else if (!initialized.current) {
      setTitleAr("");
      setTitleEn("");
      setDescriptionAr("");
      setPrice("");
      setOriginalPrice("");
      setAdvertiserName("");
      setContactPhone("");
      setWhatsappNumber("");
      setCategoryId("");
      setCity("");
      setGovernorateId("");
      setCityId("");
      setCenterId("");
      setLatInput("");
      setLngInput("");
      setImageItems([]);
      setCompanyId("");
      setPublishActive(true);
      setSaveAsDraft(false);
      setDynamicValues({});
    }
    previousCategoryId.current = source?.category?.id || "";
    initialized.current = true;
  }, [active, product, effectiveProduct, isEdit]);

  useEffect(() => {
    if (!active || !effectiveProduct?.fieldValues?.length) return;
    setDynamicValues(fieldValuesToMap(effectiveProduct.fieldValues));
  }, [active, effectiveProduct?.fieldValues, effectiveProduct?.id]);

  useEffect(() => {
    if (!active || isEdit) return;
    if (previousCategoryId.current && previousCategoryId.current !== categoryId) {
      setDynamicValues({});
    }
    previousCategoryId.current = categoryId;
  }, [categoryId, active, isEdit]);

  const categoryOptions = useMemo(() => {
    if (scope !== "admin" || !companyId) return categories;
    const company = (companiesData?.items || []).find((item) => item.id === companyId);
    const allowedIds = company?.allowedCategories?.map((item) => item.id);
    if (!allowedIds) return categories;
    return categories.filter((cat) => allowedIds.includes(cat.id) || cat.id === categoryId);
  }, [scope, companyId, categories, companiesData?.items, categoryId]);

  const selectedCategory = useMemo(
    () => categoryOptions.find((cat) => cat.id === categoryId) || categories.find((cat) => cat.id === categoryId),
    [categoryOptions, categories, categoryId]
  );
  const requiresCityAndCenter = selectedCategory?.requiresCityAndCenter === true;
  const requiresGovernorate = selectedCategory?.requiresGovernorate === true && !requiresCityAndCenter;

  const { data: locationGovernorates = [] } = useQuery({
    queryKey: ["active-governorates", language],
    queryFn: () => fetchActiveGovernorates(),
    enabled: active && requiresCityAndCenter,
  });

  const { data: locationCities = [] } = useQuery({
    queryKey: ["active-cities", language, governorateId],
    queryFn: () => fetchActiveCities(undefined, governorateId),
    enabled: active && requiresCityAndCenter && Boolean(governorateId),
  });

  const { data: locationCenters = [] } = useQuery({
    queryKey: ["active-centers", cityId, language],
    queryFn: () => fetchActiveCenters(cityId),
    enabled: active && requiresCityAndCenter && Boolean(cityId),
  });

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
      if (requiresCityAndCenter && !governorateId) throw new Error(t("products.form.errorGovernorate"));
      if (requiresCityAndCenter && !cityId) throw new Error(t("products.form.errorCity"));
      if (requiresCityAndCenter && !centerId) throw new Error(t("products.form.errorCenter"));
      if (contactPhone.trim().length < 8) throw new Error(t("products.form.errorContactPhone"));
      if (whatsappNumber.trim().length < 8) throw new Error(t("products.form.errorWhatsappNumber"));

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
        advertiserName: advertiserName.trim() || undefined,
        contactPhone: contactPhone.trim(),
        whatsappNumber: whatsappNumber.trim(),
        categoryId,
        city: requiresCityAndCenter
          ? locationCities.find((item) => item.id === cityId)?.nameAr || city || undefined
          : requiresGovernorate
            ? city || undefined
            : undefined,
        ...(requiresCityAndCenter ? { governorateId, cityId, centerId } : {}),
        ...(parsedLat !== undefined && parsedLng !== undefined ? { lat: parsedLat, lng: parsedLng } : {}),
        price: price.trim() === "" ? null : Number(price),
        originalPrice: originalPrice.trim() === "" ? null : Number(originalPrice),
        images,
        dynamicFields: buildDynamicFieldsPayload(categoryFields, dynamicValues),
      };

      if (scope === "admin") {
        if (isEdit && resolvedId) {
          return updateAdminProductApi(resolvedId, {
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

      if (isEdit && resolvedId) {
        return updateCompanyProductApi(resolvedId, {
          ...payload,
          isDraft: saveAsDraft,
          submit: !saveAsDraft,
        });
      }
      return createCompanyProductApi({ ...payload, isDraft: saveAsDraft });
    },
    onSuccess: () => {
      onSuccess();
    },
    onError: (err: unknown) => setError(getApiErrorMessage(err, t("products.form.saveFailed"))),
  });

  const isQuotaExceeded = scope === "company" && !canAdd && !isEdit && !saveAsDraft;
  const canSave = !saveMutation.isPending && !isQuotaExceeded;
  const onSave = () => saveMutation.mutate();

  const sectionCardSx = {
    p: { xs: 2, sm: 2.5 },
    borderRadius: "10px",
    bgcolor: "background.paper",
    border: 1,
    borderColor: "divider",
    boxShadow: (theme: any) =>
      theme.palette.mode === "dark" ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
  };

  // Section 1: Basic Details & Category
  const basicDetailsSection = (
    <Paper variant="outlined" sx={sectionCardSx}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <CategoryOutlined color="primary" fontSize="small" />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}>
            {isArabic ? "البيانات الأساسية والتصنيف" : "Basic Information & Category"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isArabic ? "حدد القسم المناسب واسم المنتج والوصف" : "Select category, product title, and description"}
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={2.25}>
        {scope === "admin" && !isEdit ? (
          <Autocomplete
            options={companiesData?.items || []}
            loading={companiesLoading}
            value={(companiesData?.items || []).find((company) => company.id === companyId) || null}
            onChange={(_event, company) => setCompanyId(company?.id || "")}
            getOptionLabel={(company) => company.name || ""}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={isArabic ? "لا توجد شركات معتمدة" : "No approved companies"}
            renderOption={(props, company) => {
              const { key, ...optionProps } = props;
              return (
                <li key={key} {...optionProps}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {company.name}
                    </Typography>
                    {company.city ? (
                      <Typography variant="caption" color="text.secondary">
                        {company.city}
                      </Typography>
                    ) : null}
                  </Box>
                </li>
              );
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                size="small"
                label={t("products.form.ownerCompany")}
                placeholder={t("products.form.selectCompany")}
                helperText={t("products.form.ownerCompanyHint")}
                slotProps={{
                  ...params.slotProps,
                  input: {
                    ...params.slotProps?.input,
                    endAdornment: (
                      <>
                        {companiesLoading ? <CircularProgress color="inherit" size={16} /> : null}
                        {params.slotProps?.input?.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
        ) : null}

        <TextField
          select
          required
          size="small"
          fullWidth
          label={t("products.form.category")}
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setCityId("");
            setCenterId("");
          }}
          helperText={
            !categoryId
              ? isArabic
                ? "اختر التصنيف لعرض الحقول والمواصفات الخاصة به"
                : "Choose category to load dynamic fields"
              : undefined
          }
        >
          <MenuItem value="">{t("products.form.selectCategory")}</MenuItem>
          {categoryOptions.map((cat) => (
            <MenuItem key={cat.id} value={cat.id}>
              {categoryName(cat)}
            </MenuItem>
          ))}
        </TextField>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            size="small"
            required
            fullWidth
            label={t("products.form.titleAr")}
            placeholder={isArabic ? "مثال: جرار زراعي فيات موديل 2020" : "e.g. Fiat Agricultural Tractor 2020"}
            value={titleAr}
            onChange={(e) => setTitleAr(e.target.value)}
          />
          <TextField
            size="small"
            fullWidth
            label={t("products.form.titleEn")}
            placeholder={isArabic ? "اختياري" : "Optional"}
            value={titleEn}
            onChange={(e) => setTitleEn(e.target.value)}
          />
        </Box>

        <TextField
          size="small"
          required
          fullWidth
          multiline
          minRows={3.5}
          label={t("products.form.descriptionAr")}
          placeholder={
            isArabic
              ? "اكتب وصفاً مفصلاً للمنتج، مميزاته، حالته، وأي تفاصيل تهم المشتري..."
              : "Detailed description of the product, features, condition..."
          }
          value={descriptionAr}
          onChange={(e) => setDescriptionAr(e.target.value)}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            size="small"
            fullWidth
            type="number"
            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            label={t("products.form.price")}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <TextField
            size="small"
            fullWidth
            type="number"
            slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
            label={t("products.form.originalPrice")}
            value={originalPrice}
            onChange={(e) => setOriginalPrice(e.target.value)}
          />
        </Box>

        {categoryId && categoryFieldsLoading ? (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, py: 1.5, px: 2, bgcolor: "action.hover", borderRadius: 1.5 }}>
            <CircularProgress size={18} />
            <Typography variant="body2" color="text.secondary">
              {t("products.form.loadingFields")}
            </Typography>
          </Box>
        ) : null}

        {categoryId && !categoryFieldsLoading && categoryFields.length > 0 ? (
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
      </Stack>
    </Paper>
  );

  // Section 2: Contact Information
  const contactSection = (
    <Paper variant="outlined" sx={sectionCardSx}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <PhoneIphone color="primary" fontSize="small" />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}>
            {isArabic ? "بيانات صاحب الإعلان للتواصل" : "Advertiser Contact Details"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isArabic ? "أرقام التواصل التي ستظهر للمشترين" : "Contact details shown to interested buyers"}
          </Typography>
        </Box>
        {contactPhone && contactPhone !== whatsappNumber ? (
          <Button
            size="small"
            variant="text"
            startIcon={<ContentCopy sx={{ fontSize: "14px !important" }} />}
            onClick={() => setWhatsappNumber(contactPhone)}
            sx={{ fontSize: "12px", whiteSpace: "nowrap" }}
          >
            {isArabic ? "نفس الرقم للواتساب" : "Same for WhatsApp"}
          </Button>
        ) : null}
      </Stack>

      <Stack spacing={2}>
        <TextField
          size="small"
          fullWidth
          label={t("products.form.advertiserName")}
          placeholder={isArabic ? "اسم الشخص أو الجهة المعلنة (اختياري)" : "Name of advertiser (optional)"}
          value={advertiserName}
          onChange={(e) => setAdvertiserName(e.target.value)}
        />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          <TextField
            size="small"
            required
            fullWidth
            label={t("products.form.contactPhone")}
            placeholder="01XXXXXXXXX"
            value={contactPhone}
            onChange={(e) => setContactPhone(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <Call fontSize="small" sx={{ color: "text.secondary", mr: 1 }} />,
              },
            }}
          />
          <TextField
            size="small"
            required
            fullWidth
            label={t("products.form.whatsappNumber")}
            placeholder="01XXXXXXXXX"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <WhatsApp fontSize="small" sx={{ color: "#25D366", mr: 1 }} />,
              },
            }}
          />
        </Box>
      </Stack>
    </Paper>
  );

  // Section 3: Product Images
  const imagesSection = (
    <Paper variant="outlined" sx={sectionCardSx}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <PhotoCameraOutlined color="primary" fontSize="small" />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}>
            {t("products.form.images")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isArabic
              ? "أضف صور واضحة للمنتج - الصورة الأولى هي الصورة الرئيسية للغلاف"
              : "Upload clear product photos - the first image will be the cover photo"}
          </Typography>
        </Box>
      </Stack>
      <ProductImagePicker
        items={imageItems}
        onChange={setImageItems}
        addLabel={t("products.form.addImages")}
        disabled={saveMutation.isPending}
      />
    </Paper>
  );

  // Section 4: Location & Map
  const locationSection = (
    <Paper variant="outlined" sx={sectionCardSx}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 2 }}>
        <LocationOn color="primary" fontSize="small" />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}>
            {t("products.form.locationTitle")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {requiresCityAndCenter
              ? isArabic
                ? "المحافظة والمدينة والمركز وتحديد الموقع على الخريطة"
                : "Governorate, city, center, and optional map position"
              : isArabic
                ? "المحافظة وتحديد الموقع على الخريطة"
                : "Governorate and interactive map position"}
          </Typography>
        </Box>
      </Stack>

      <Stack spacing={2}>
        {requiresCityAndCenter ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              select
              size="small"
              fullWidth
              required
              label={t("products.form.governorate")}
              value={governorateId}
              onChange={(e) => {
                setGovernorateId(e.target.value);
                setCityId("");
                setCenterId("");
                setCity("");
              }}
            >
              <MenuItem value="">{t("categories.fields.select")}</MenuItem>
              {locationGovernorates.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {language === "ar" ? option.nameAr || option.nameEn || option.name : option.nameEn || option.nameAr || option.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              fullWidth
              required
              label={t("products.form.city")}
              value={cityId}
              disabled={!governorateId}
              onChange={(e) => {
                setCityId(e.target.value);
                setCenterId("");
                const selected = locationCities.find((item) => item.id === e.target.value);
                setCity(selected?.nameAr || selected?.name || "");
              }}
            >
              <MenuItem value="">{t("categories.fields.select")}</MenuItem>
              {locationCities.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {language === "ar" ? option.nameAr || option.nameEn || option.name : option.nameEn || option.nameAr || option.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              size="small"
              fullWidth
              required
              label={t("products.form.center")}
              value={centerId}
              disabled={!cityId}
              onChange={(e) => setCenterId(e.target.value)}
            >
              <MenuItem value="">{t("categories.fields.select")}</MenuItem>
              {locationCenters.map((option) => (
                <MenuItem key={option.id} value={option.id}>
                  {language === "ar" ? option.nameAr || option.nameEn || option.name : option.nameEn || option.nameAr || option.name}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        ) : requiresGovernorate ? (
          <TextField
            select
            size="small"
            fullWidth
            required
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

        {latInput && lngInput ? (
          <Paper
            variant="outlined"
            sx={{
              p: 1.5,
              borderRadius: "8px",
              borderColor: "success.main",
              bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(46,125,50,0.12)" : "rgba(46,125,50,0.06)"),
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
            }}
          >
            <Stack direction="row" spacing={1.25} sx={{ alignItems: "center", minWidth: 0 }}>
              <LocationOn color="success" />
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: "success.main" }}>
                  {isArabic ? "تم تحديد الموقع على الخريطة" : "Location Selected"}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                  ({Number(latInput).toFixed(4)}, {Number(lngInput).toFixed(4)})
                </Typography>
              </Box>
            </Stack>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Button size="small" variant="outlined" color="success" onClick={() => setIsMapOpen(true)}>
                {isArabic ? "تعديل" : "Edit"}
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
                <Clear fontSize="small" />
              </IconButton>
            </Stack>
          </Paper>
        ) : (
          <Button
            fullWidth
            size="medium"
            variant="outlined"
            startIcon={<AddLocationAlt />}
            onClick={() => setIsMapOpen(true)}
            sx={{ py: 1.25, borderRadius: "8px", fontWeight: 600 }}
          >
            {isArabic ? "تحديد الموقع على الخريطة (اختياري)" : "Select Location on Map (Optional)"}
          </Button>
        )}
      </Stack>
    </Paper>
  );

  // Section 5: Publishing Settings
  const publishingSection = (
    <Paper variant="outlined" sx={sectionCardSx}>
      <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 1.5 }}>
        <SettingsOutlined color="primary" fontSize="small" />
        <Box>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: "text.primary", lineHeight: 1.2 }}>
            {isArabic ? "إعدادات النشر" : "Publishing & Status"}
          </Typography>
        </Box>
      </Stack>

      {scope === "admin" ? (
        <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: "action.hover" }}>
          <FormControlLabel
            control={
              <Switch
                checked={publishActive}
                onChange={(e) => setPublishActive(e.target.checked)}
                color="success"
              />
            }
            label={
              <Box sx={{ ml: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t("products.form.publishActive")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isArabic
                    ? "تفعيل المنتج فوراً ليكون متاحاً ونشطاً في التطبيق"
                    : "Publish product immediately as active"}
                </Typography>
              </Box>
            }
            sx={{ m: 0, width: "100%", justifyContent: "space-between" }}
          />
        </Box>
      ) : (
        <Box sx={{ p: 1.5, borderRadius: "8px", bgcolor: "action.hover" }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={saveAsDraft}
                onChange={(e) => setSaveAsDraft(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box sx={{ ml: 0.5 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {t("products.form.saveDraft")}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {isArabic
                    ? "حفظ المنتج كمسودة للرجوع إليه وتعديله لاحقاً قبل النشر، دون استهلاك حصة الإعلانات."
                    : "Save as draft to finish later without consuming your quota."}
                </Typography>
              </Box>
            }
            sx={{ m: 0, alignItems: "flex-start" }}
          />
        </Box>
      )}
    </Paper>
  );

  // Sticky / Standard Actions bar
  const actionsBar = (
    <Box
      sx={{
        position: inDrawer ? "sticky" : "static",
        bottom: inDrawer ? 0 : "auto",
        zIndex: 20,
        bgcolor: "background.paper",
        borderTop: 1,
        borderColor: "divider",
        px: { xs: 2, sm: 2.5 },
        py: 1.75,
        mx: inDrawer ? { xs: -2.5, sm: -2.5 } : 0,
        mb: inDrawer ? { xs: -2, sm: -2 } : 0,
        mt: inDrawer ? 2.5 : 1,
        boxShadow: (theme) =>
          theme.palette.mode === "dark" ? "0 -4px 16px rgba(0,0,0,0.4)" : "0 -4px 16px rgba(0,0,0,0.06)",
        borderRadius: inDrawer ? 0 : "10px",
      }}
    >
      {showActions && !actionsSlot ? (
        <Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end", alignItems: "center" }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={onCancel}
            disabled={saveMutation.isPending}
            sx={{ minWidth: 100, py: 1, borderRadius: "8px" }}
          >
            {t("products.cancel")}
          </Button>
          <Button
            variant="contained"
            color="primary"
            disabled={!canSave}
            onClick={onSave}
            startIcon={saveMutation.isPending ? <CircularProgress size={16} color="inherit" /> : <Save />}
            sx={{
              minWidth: 160,
              py: 1,
              fontWeight: 700,
              borderRadius: "8px",
              whiteSpace: "nowrap",
            }}
          >
            {saveMutation.isPending
              ? t("products.form.saving")
              : isEdit
                ? t("products.form.save")
                : t("products.form.create")}
          </Button>
        </Stack>
      ) : null}
      {actionsSlot ? actionsSlot({ saving: saveMutation.isPending, onSave, onCancel, canSave }) : null}
    </Box>
  );

  return (
    <Box sx={{ width: "100%", position: "relative" }}>
      {error ? (
        <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }} onClose={() => setError(null)}>
          {error}
        </Alert>
      ) : null}

      {isQuotaExceeded ? (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: "8px" }}>
          {isArabic
            ? "لقد استهلكت الحصة المتاحة لإضافة المنتجات في باقتك. يمكنك تفعيل خيار 'حفظ كمسودة' بالأسفل لحفظ الإعلان كمسودة دون استهلاك الحصة، أو ترقية باقتك."
            : "You have reached your product quota. Check 'Save as draft' below to save without consuming quota."}
        </Alert>
      ) : null}

      {/* When inside Drawer: spacious, sequential card flow with full width utilization */}
      {inDrawer ? (
        <Stack spacing={2.5}>
          {basicDetailsSection}
          {imagesSection}
          {contactSection}
          {locationSection}
          {publishingSection}
          {actionsBar}
        </Stack>
      ) : (
        /* When on full page: 2-column layout */
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "1.2fr 0.8fr" },
            gap: 2.5,
            alignItems: "start",
          }}
        >
          <Stack spacing={2.5} sx={{ minWidth: 0 }}>
            {basicDetailsSection}
            {contactSection}
          </Stack>
          <Stack spacing={2.5} sx={{ minWidth: 0 }}>
            {imagesSection}
            {locationSection}
            {publishingSection}
            {actionsBar}
          </Stack>
        </Box>
      )}

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
    </Box>
  );
}
