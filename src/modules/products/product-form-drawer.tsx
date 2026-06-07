import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AppDrawer } from "../../components/design-system";
import { useI18n } from "../../hooks/use-i18n";
import {
  createAdminProductApi,
  fetchAdminCategories,
  fetchAdminCompanies,
  updateAdminProductApi,
  type AdminProduct,
  type ProductFormPayload,
} from "../../services/admin-api";
import { createCompanyProductApi, fetchProductCategories, updateCompanyProductApi } from "../../services/products-api";
import { getApiErrorMessage } from "../../utils/api-error";

type Props = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  scope: "admin" | "company";
  product?: AdminProduct | null;
  canAdd?: boolean;
};

function parseImagesInput(value: string) {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

export function ProductFormDrawer({ open, onClose, onSuccess, scope, product, canAdd = true }: Props) {
  const { t } = useI18n();
  const isEdit = Boolean(product);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState("kg");
  const [price, setPrice] = useState(0);
  const [city, setCity] = useState("");
  const [target, setTarget] = useState<"LOCAL" | "EXPORT">("LOCAL");
  const [imagesText, setImagesText] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [publishActive, setPublishActive] = useState(false);
  const [saveAsDraft, setSaveAsDraft] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ["product-categories", scope],
    queryFn: () => (scope === "admin" ? fetchAdminCategories() : fetchProductCategories()),
    enabled: open,
  });

  const { data: companiesData } = useQuery({
    queryKey: ["admin-companies-select"],
    queryFn: () => fetchAdminCompanies({ page: 1, limit: 100, status: "APPROVED" }),
    enabled: open && scope === "admin" && !isEdit,
  });

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (product) {
      setTitle(product.title);
      setDescription(product.description || "");
      setCategoryId(product.category?.id || "");
      setQuantity(product.quantity ?? 1);
      setUnit(product.unit || "kg");
      setPrice(product.price || 0);
      setTarget((product.target as "LOCAL" | "EXPORT") || "LOCAL");
      setCity(product.city || "");
      setImagesText((product.images || []).map((img) => img.path).join(", "));
      setCompanyId(product.company?.id || "");
      setPublishActive(product.status === "ACTIVE");
      setSaveAsDraft(product.status === "DRAFT");
    } else {
      setTitle("");
      setDescription("");
      setCategoryId("");
      setQuantity(1);
      setUnit("kg");
      setPrice(0);
      setCity("");
      setTarget("LOCAL");
      setImagesText("");
      setCompanyId("");
      setPublishActive(false);
      setSaveAsDraft(false);
    }
  }, [open, product]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim() || title.trim().length < 2) throw new Error("Title must be at least 2 characters");
      if (!description.trim() || description.trim().length < 5) {
        throw new Error("Description must be at least 5 characters");
      }
      if (!categoryId) throw new Error("Category is required");
      if (!unit.trim()) throw new Error("Unit is required");
      if (Number.isNaN(Number(quantity)) || Number(quantity) < 0) {
        throw new Error("Quantity must be a valid non-negative number");
      }
      if (Number.isNaN(Number(price)) || Number(price) < 0) {
        throw new Error("Price must be a valid non-negative number");
      }

      const payload: ProductFormPayload = {
        title,
        description,
        categoryId,
        quantity: Number(quantity),
        unit,
        price: Number(price),
        city: city || undefined,
        target,
        images: parseImagesInput(imagesText),
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
        throw new Error("Product quota reached. Delete or wait for moderation before adding more.");
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
          label={t("products.form.title")}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <TextField
          size="small"
          fullWidth
          label={t("products.form.description")}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
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
              {cat.nameAr || cat.nameEn || cat.id}
            </MenuItem>
          ))}
        </TextField>
        <Grid container spacing={2}>
          <Grid size={6}>
            <TextField
              size="small"
              fullWidth
              type="number"
              label={t("products.form.quantity")}
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              slotProps={{ htmlInput: { min: 0 } }}
            />
          </Grid>
          <Grid size={6}>
            <TextField
              size="small"
              fullWidth
              label={t("products.form.unit")}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
          </Grid>
        </Grid>
        <TextField
          size="small"
          fullWidth
          type="number"
          label={t("products.form.price")}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
          slotProps={{ htmlInput: { min: 0 } }}
        />
        <TextField
          size="small"
          fullWidth
          label={t("products.form.city")}
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <TextField
          select
          size="small"
          fullWidth
          label={t("products.form.target")}
          value={target}
          onChange={(e) => setTarget(e.target.value as "LOCAL" | "EXPORT")}
        >
          <MenuItem value="LOCAL">{t("products.form.targetLocal")}</MenuItem>
          <MenuItem value="EXPORT">{t("products.form.targetExport")}</MenuItem>
        </TextField>
        <TextField
          size="small"
          fullWidth
          label={t("products.form.images")}
          value={imagesText}
          onChange={(e) => setImagesText(e.target.value)}
          placeholder="/uploads/a.jpg, /uploads/b.jpg"
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
    </AppDrawer>
  );
}
