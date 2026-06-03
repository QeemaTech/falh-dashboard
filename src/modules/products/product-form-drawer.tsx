import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { AppDrawer, AppSelect } from "../../components/design-system";
import {
  createAdminProductApi,
  fetchAdminCategories,
  fetchAdminCompanies,
  updateAdminProductApi,
  type AdminProduct,
  type ProductFormPayload,
} from "../../services/admin-api";
import { createCompanyProductApi, fetchProductCategories, updateCompanyProductApi } from "../../services/products-api";

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
    onError: (err: Error) => setError(err.message),
  });

  const companyCategories = categories;

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit Product" : "Add Product"}
      footer={
        <>
          <Button
            disabled={saveMutation.isPending || (!canAdd && scope === "company" && !isEdit && !saveAsDraft)}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? "Saving..." : isEdit ? "Save Changes" : "Create Product"}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        {error ? <p className="text-red-500">{error}</p> : null}
        <div>
          <label className="font-medium">Title</label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="font-medium">Description</label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="font-medium">Category</label>
          <AppSelect value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">Select category</option>
            {companyCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameAr || cat.nameEn || cat.id}
              </option>
            ))}
          </AppSelect>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="font-medium">Quantity</label>
            <Input type="number" min={0} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          </div>
          <div>
            <label className="font-medium">Unit</label>
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} />
          </div>
        </div>
        <div>
          <label className="font-medium">Price (EGP)</label>
          <Input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
        </div>
        <div>
          <label className="font-medium">City</label>
          <Input value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <div>
          <label className="font-medium">Target</label>
          <AppSelect value={target} onChange={(e) => setTarget(e.target.value as "LOCAL" | "EXPORT")}>
            <option value="LOCAL">Local</option>
            <option value="EXPORT">Export</option>
          </AppSelect>
        </div>
        <div>
          <label className="font-medium">Image URLs (comma-separated)</label>
          <Input value={imagesText} onChange={(e) => setImagesText(e.target.value)} placeholder="/uploads/a.jpg, /uploads/b.jpg" />
        </div>
        {scope === "admin" && !isEdit ? (
          <div>
            <label className="font-medium">Owner Company (optional)</label>
            <AppSelect value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              <option value="">Global / Marketplace (no company)</option>
              {(companiesData?.items || []).map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </AppSelect>
          </div>
        ) : null}
        {scope === "admin" ? (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={publishActive} onChange={(e) => setPublishActive(e.target.checked)} />
            Publish immediately (Approved / Active)
          </label>
        ) : (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={saveAsDraft} onChange={(e) => setSaveAsDraft(e.target.checked)} />
            Save as draft (does not use quota)
          </label>
        )}
      </div>
    </AppDrawer>
  );
}
