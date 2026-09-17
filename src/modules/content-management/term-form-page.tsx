import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { FormPageShell } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  createAdminTermApi,
  fetchAdminTerms,
  updateAdminTermApi,
  type TermsItem,
} from "../../services/admin-api";
import { getApiErrorMessage } from "../../utils/api-error";

function TermFormFields({
  initial,
  defaultSortOrder,
  onSuccess,
  onCancel,
}: {
  initial?: TermsItem | null;
  defaultSortOrder: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { t, isArabic } = useI18n();
  const [titleAr, setTitleAr] = useState(initial?.titleAr || "");
  const [titleEn, setTitleEn] = useState(initial?.titleEn || "");
  const [contentAr, setContentAr] = useState(initial?.contentAr || "");
  const [contentEn, setContentEn] = useState(initial?.contentEn || "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? defaultSortOrder);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) return;
    setTitleAr(initial.titleAr);
    setTitleEn(initial.titleEn || "");
    setContentAr(initial.contentAr);
    setContentEn(initial.contentEn || "");
    setSortOrder(initial.sortOrder);
    setIsActive(initial.isActive);
  }, [initial]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      if (!titleAr.trim()) throw new Error(isArabic ? "العنوان بالعربية مطلوب" : "Arabic title is required");
      if (!contentAr.trim()) throw new Error(isArabic ? "المحتوى بالعربية مطلوب" : "Arabic content is required");
      const payload = {
        titleAr: titleAr.trim(),
        titleEn: titleEn.trim() || undefined,
        contentAr: contentAr.trim(),
        contentEn: contentEn.trim() || undefined,
        sortOrder: Number(sortOrder),
        isActive,
      };
      if (initial) return updateAdminTermApi(initial.id, payload);
      return createAdminTermApi(payload);
    },
    onSuccess,
    onError: (err: unknown) => setError(getApiErrorMessage(err, "Failed to save term")),
  });

  return (
    <Stack spacing={2.5}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField
        fullWidth
        size="small"
        label={isArabic ? "عنوان البند (عربي) *" : "Title (Arabic) *"}
        value={titleAr}
        onChange={(e) => setTitleAr(e.target.value)}
      />
      <TextField
        fullWidth
        size="small"
        label={isArabic ? "عنوان البند (إنجليزي)" : "Title (English)"}
        value={titleEn}
        onChange={(e) => setTitleEn(e.target.value)}
      />
      <TextField
        fullWidth
        multiline
        minRows={4}
        label={isArabic ? "نص البند (عربي) *" : "Content (Arabic) *"}
        value={contentAr}
        onChange={(e) => setContentAr(e.target.value)}
      />
      <TextField
        fullWidth
        multiline
        minRows={4}
        label={isArabic ? "نص البند (إنجليزي)" : "Content (English)"}
        value={contentEn}
        onChange={(e) => setContentEn(e.target.value)}
      />
      <TextField
        fullWidth
        size="small"
        type="number"
        label={isArabic ? "ترتيب العرض" : "Sort Order"}
        value={sortOrder}
        onChange={(e) => setSortOrder(Number(e.target.value))}
      />
      <FormControlLabel
        control={<Switch checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />}
        label={isArabic ? "تفعيل البند" : "Active"}
      />
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          disabled={saveMutation.isPending}
          onClick={() => saveMutation.mutate()}
          sx={{ borderRadius: "8px" }}
        >
          {saveMutation.isPending ? t("common.saving") : t("common.save")}
        </Button>
        <Button onClick={onCancel} sx={{ borderRadius: "8px" }}>
          {t("common.cancel")}
        </Button>
      </Stack>
    </Stack>
  );
}

export function TermCreatePage() {
  const { isArabic } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: terms = [], isLoading } = useQuery({
    queryKey: ["admin-terms"],
    queryFn: fetchAdminTerms,
  });

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  return (
    <FormPageShell
      title={isArabic ? "إضافة بند شروط وأحكام جديد" : "Add New Term Clause"}
      backTo="/content-management"
    >
      <TermFormFields
        defaultSortOrder={terms.length * 10 + 10}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-terms"] });
          navigate("/content-management");
        }}
        onCancel={() => navigate("/content-management")}
      />
    </FormPageShell>
  );
}

export function TermEditPage() {
  const { id } = useParams<{ id: string }>();
  const { isArabic } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: terms = [], isLoading } = useQuery({
    queryKey: ["admin-terms"],
    queryFn: fetchAdminTerms,
  });
  const term = terms.find((item) => item.id === id) || null;

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (!term) {
    return (
      <FormPageShell title={isArabic ? "بند غير موجود" : "Term not found"} backTo="/content-management">
        <Alert severity="warning">{isArabic ? "لم يتم العثور على البند" : "Term clause not found"}</Alert>
      </FormPageShell>
    );
  }

  return (
    <FormPageShell
      title={isArabic ? "تعديل بند شروط وأحكام" : "Edit Term Clause"}
      backTo="/content-management"
    >
      <TermFormFields
        initial={term}
        defaultSortOrder={term.sortOrder}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-terms"] });
          navigate("/content-management");
        }}
        onCancel={() => navigate("/content-management")}
      />
    </FormPageShell>
  );
}
