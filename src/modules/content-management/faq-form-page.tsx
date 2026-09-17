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
  createAdminFaqApi,
  fetchAdminFaqs,
  updateAdminFaqApi,
  type FaqItem,
} from "../../services/admin-api";
import { getApiErrorMessage } from "../../utils/api-error";

function FaqFormFields({
  initial,
  defaultSortOrder,
  onSuccess,
  onCancel,
}: {
  initial?: FaqItem | null;
  defaultSortOrder: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const { t, isArabic } = useI18n();
  const [questionAr, setQuestionAr] = useState(initial?.questionAr || "");
  const [questionEn, setQuestionEn] = useState(initial?.questionEn || "");
  const [answerAr, setAnswerAr] = useState(initial?.answerAr || "");
  const [answerEn, setAnswerEn] = useState(initial?.answerEn || "");
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? defaultSortOrder);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!initial) return;
    setQuestionAr(initial.questionAr);
    setQuestionEn(initial.questionEn || "");
    setAnswerAr(initial.answerAr);
    setAnswerEn(initial.answerEn || "");
    setSortOrder(initial.sortOrder);
    setIsActive(initial.isActive);
  }, [initial]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      setError(null);
      if (!questionAr.trim())
        throw new Error(isArabic ? "السؤال بالعربية مطلوب" : "Arabic question is required");
      if (!answerAr.trim())
        throw new Error(isArabic ? "الإجابة بالعربية مطلوبة" : "Arabic answer is required");
      const payload = {
        questionAr: questionAr.trim(),
        questionEn: questionEn.trim() || undefined,
        answerAr: answerAr.trim(),
        answerEn: answerEn.trim() || undefined,
        sortOrder: Number(sortOrder),
        isActive,
      };
      if (initial) return updateAdminFaqApi(initial.id, payload);
      return createAdminFaqApi(payload);
    },
    onSuccess,
    onError: (err: unknown) => setError(getApiErrorMessage(err, "Failed to save FAQ")),
  });

  return (
    <Stack spacing={2.5}>
      {error ? <Alert severity="error">{error}</Alert> : null}
      <TextField
        fullWidth
        size="small"
        label={isArabic ? "السؤال (عربي) *" : "Question (Arabic) *"}
        value={questionAr}
        onChange={(e) => setQuestionAr(e.target.value)}
      />
      <TextField
        fullWidth
        size="small"
        label={isArabic ? "السؤال (إنجليزي)" : "Question (English)"}
        value={questionEn}
        onChange={(e) => setQuestionEn(e.target.value)}
      />
      <TextField
        fullWidth
        multiline
        minRows={3}
        label={isArabic ? "الإجابة (عربي) *" : "Answer (Arabic) *"}
        value={answerAr}
        onChange={(e) => setAnswerAr(e.target.value)}
      />
      <TextField
        fullWidth
        multiline
        minRows={3}
        label={isArabic ? "الإجابة (إنجليزي)" : "Answer (English)"}
        value={answerEn}
        onChange={(e) => setAnswerEn(e.target.value)}
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
        label={isArabic ? "تفعيل السؤال" : "Active"}
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

export function FaqCreatePage() {
  const { isArabic } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: fetchAdminFaqs,
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
      title={isArabic ? "إضافة سؤال شائع جديد" : "Add New FAQ Item"}
      backTo="/content-management"
    >
      <FaqFormFields
        defaultSortOrder={faqs.length * 10 + 10}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
          navigate("/content-management");
        }}
        onCancel={() => navigate("/content-management")}
      />
    </FormPageShell>
  );
}

export function FaqEditPage() {
  const { id } = useParams<{ id: string }>();
  const { isArabic } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: faqs = [], isLoading } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: fetchAdminFaqs,
  });
  const faq = faqs.find((item) => item.id === id) || null;

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (!faq) {
    return (
      <FormPageShell title={isArabic ? "سؤال غير موجود" : "FAQ not found"} backTo="/content-management">
        <Alert severity="warning">{isArabic ? "لم يتم العثور على السؤال" : "FAQ item not found"}</Alert>
      </FormPageShell>
    );
  }

  return (
    <FormPageShell
      title={isArabic ? "تعديل سؤال شائع" : "Edit FAQ Item"}
      backTo="/content-management"
    >
      <FaqFormFields
        initial={faq}
        defaultSortOrder={faq.sortOrder}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
          navigate("/content-management");
        }}
        onCancel={() => navigate("/content-management")}
      />
    </FormPageShell>
  );
}
