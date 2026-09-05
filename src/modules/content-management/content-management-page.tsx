import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Add,
  Delete,
  Edit,
  Gavel,
  HelpOutlined,
  PrivacyTip,
  Save,
} from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useI18n } from "../../hooks/use-i18n";
import {
  createAdminFaqApi,
  createAdminTermApi,
  deleteAdminFaqApi,
  deleteAdminTermApi,
  fetchAdminFaqs,
  fetchAdminPrivacyPolicy,
  fetchAdminTerms,
  updateAdminFaqApi,
  updateAdminPrivacyPolicyApi,
  updateAdminTermApi,
  type FaqItem,
  type PrivacyPolicy,
  type TermsItem,
} from "../../services/admin-api";
import { getApiErrorMessage } from "../../utils/api-error";

type TabValue = "terms" | "faq" | "privacy";

export function ContentManagementPage() {
  const { t, isArabic } = useI18n();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabValue>("terms");

  // --- Terms & Conditions State ---
  const [termDialogOpen, setTermDialogOpen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<TermsItem | null>(null);
  const [termTitleAr, setTermTitleAr] = useState("");
  const [termTitleEn, setTermTitleEn] = useState("");
  const [termContentAr, setTermContentAr] = useState("");
  const [termContentEn, setTermContentEn] = useState("");
  const [termSortOrder, setTermSortOrder] = useState(0);
  const [termIsActive, setTermIsActive] = useState(true);
  const [termError, setTermError] = useState<string | null>(null);

  // --- FAQ State ---
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [faqQuestionAr, setFaqQuestionAr] = useState("");
  const [faqQuestionEn, setFaqQuestionEn] = useState("");
  const [faqAnswerAr, setFaqAnswerAr] = useState("");
  const [faqAnswerEn, setFaqAnswerEn] = useState("");
  const [faqSortOrder, setFaqSortOrder] = useState(0);
  const [faqIsActive, setFaqIsActive] = useState(true);
  const [faqError, setFaqError] = useState<string | null>(null);

  // --- Privacy Policy State ---
  const [privacyForm, setPrivacyForm] = useState<Partial<PrivacyPolicy>>({});
  const [privacySuccess, setPrivacySuccess] = useState(false);
  const [privacyError, setPrivacyError] = useState<string | null>(null);

  // Queries
  const { data: terms = [], isLoading: loadingTerms } = useQuery({
    queryKey: ["admin-terms"],
    queryFn: fetchAdminTerms,
  });

  const { data: faqs = [], isLoading: loadingFaqs } = useQuery({
    queryKey: ["admin-faqs"],
    queryFn: fetchAdminFaqs,
  });

  const { data: privacyPolicy, isLoading: loadingPrivacy } = useQuery({
    queryKey: ["admin-privacy-policy"],
    queryFn: async () => {
      const data = await fetchAdminPrivacyPolicy();
      setPrivacyForm(data || {});
      return data;
    },
  });

  // Terms Mutations
  const saveTermMutation = useMutation({
    mutationFn: async () => {
      setTermError(null);
      if (!termTitleAr.trim()) throw new Error(isArabic ? "العنوان بالعربية مطلوب" : "Arabic title is required");
      if (!termContentAr.trim()) throw new Error(isArabic ? "المحتوى بالعربية مطلوب" : "Arabic content is required");

      const payload = {
        titleAr: termTitleAr.trim(),
        titleEn: termTitleEn.trim() || undefined,
        contentAr: termContentAr.trim(),
        contentEn: termContentEn.trim() || undefined,
        sortOrder: Number(termSortOrder),
        isActive: termIsActive,
      };

      if (editingTerm) {
        return updateAdminTermApi(editingTerm.id, payload);
      }
      return createAdminTermApi(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-terms"] });
      setTermDialogOpen(false);
    },
    onError: (err: unknown) => setTermError(getApiErrorMessage(err, "Failed to save term")),
  });

  const deleteTermMutation = useMutation({
    mutationFn: (termId: string) => deleteAdminTermApi(termId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-terms"] }),
  });

  const toggleTermActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAdminTermApi(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-terms"] }),
  });

  // FAQ Mutations
  const saveFaqMutation = useMutation({
    mutationFn: async () => {
      setFaqError(null);
      if (!faqQuestionAr.trim()) throw new Error(isArabic ? "السؤال بالعربية مطلوب" : "Arabic question is required");
      if (!faqAnswerAr.trim()) throw new Error(isArabic ? "الإجابة بالعربية مطلوبة" : "Arabic answer is required");

      const payload = {
        questionAr: faqQuestionAr.trim(),
        questionEn: faqQuestionEn.trim() || undefined,
        answerAr: faqAnswerAr.trim(),
        answerEn: faqAnswerEn.trim() || undefined,
        sortOrder: Number(faqSortOrder),
        isActive: faqIsActive,
      };

      if (editingFaq) {
        return updateAdminFaqApi(editingFaq.id, payload);
      }
      return createAdminFaqApi(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      setFaqDialogOpen(false);
    },
    onError: (err: unknown) => setFaqError(getApiErrorMessage(err, "Failed to save FAQ")),
  });

  const deleteFaqMutation = useMutation({
    mutationFn: (faqId: string) => deleteAdminFaqApi(faqId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-faqs"] }),
  });

  const toggleFaqActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAdminFaqApi(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-faqs"] }),
  });

  // Privacy Policy Mutation
  const savePrivacyMutation = useMutation({
    mutationFn: async () => {
      setPrivacyError(null);
      setPrivacySuccess(false);
      return updateAdminPrivacyPolicyApi({
        titleAr: privacyForm.titleAr || "سياسة الخصوصية",
        titleEn: privacyForm.titleEn || undefined,
        contentAr: privacyForm.contentAr || "",
        contentEn: privacyForm.contentEn || undefined,
        isPublished: privacyForm.isPublished ?? true,
      });
    },
    onSuccess: () => {
      setPrivacySuccess(true);
      queryClient.invalidateQueries({ queryKey: ["admin-privacy-policy"] });
    },
    onError: (err: unknown) => setPrivacyError(getApiErrorMessage(err, "Failed to save privacy policy")),
  });

  // Open Handlers
  const handleOpenTermDialog = (term?: TermsItem) => {
    setTermError(null);
    if (term) {
      setEditingTerm(term);
      setTermTitleAr(term.titleAr);
      setTermTitleEn(term.titleEn || "");
      setTermContentAr(term.contentAr);
      setTermContentEn(term.contentEn || "");
      setTermSortOrder(term.sortOrder);
      setTermIsActive(term.isActive);
    } else {
      setEditingTerm(null);
      setTermTitleAr("");
      setTermTitleEn("");
      setTermContentAr("");
      setTermContentEn("");
      setTermSortOrder(terms.length * 10 + 10);
      setTermIsActive(true);
    }
    setTermDialogOpen(true);
  };

  const handleOpenFaqDialog = (faq?: FaqItem) => {
    setFaqError(null);
    if (faq) {
      setEditingFaq(faq);
      setFaqQuestionAr(faq.questionAr);
      setFaqQuestionEn(faq.questionEn || "");
      setFaqAnswerAr(faq.answerAr);
      setFaqAnswerEn(faq.answerEn || "");
      setFaqSortOrder(faq.sortOrder);
      setFaqIsActive(faq.isActive);
    } else {
      setEditingFaq(null);
      setFaqQuestionAr("");
      setFaqQuestionEn("");
      setFaqAnswerAr("");
      setFaqAnswerEn("");
      setFaqSortOrder(faqs.length * 10 + 10);
      setFaqIsActive(true);
    }
    setFaqDialogOpen(true);
  };

  return (
    <Stack spacing={3}>
      {/* Header section */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: "bold" }} gutterBottom>
            {isArabic ? "إدارة المحتوى والصفحات" : "Content & Legal Pages Management"}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isArabic
              ? "التحكم في الشروط والأحكام، الأسئلة الشائعة، وسياسة الخصوصية المعروضة في التطبيق"
              : "Manage terms & conditions, FAQs, and privacy policy shown in the mobile application"}
          </Typography>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <Gavel color="primary" sx={{ fontSize: 36 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {terms.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isArabic ? "بنود الشروط والأحكام" : "Terms & Conditions Items"}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <HelpOutlined color="info" sx={{ fontSize: 36 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {faqs.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isArabic ? "الأسئلة الشائعة" : "FAQ Items"}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                <PrivacyTip color="success" sx={{ fontSize: 36 }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {privacyPolicy?.isPublished
                      ? isArabic
                        ? "منشورة"
                        : "Published"
                      : isArabic
                        ? "غير منشورة"
                        : "Draft"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {isArabic ? "حالة سياسة الخصوصية" : "Privacy Policy Status"}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(_, val) => setActiveTab(val as TabValue)}
          sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}
        >
          <Tab
            value="terms"
            icon={<Gavel />}
            iconPosition="start"
            label={isArabic ? "الشروط والأحكام" : "Terms & Conditions"}
          />
          <Tab
            value="faq"
            icon={<HelpOutlined />}
            iconPosition="start"
            label={isArabic ? "الأسئلة الشائعة" : "FAQ"}
          />
          <Tab
            value="privacy"
            icon={<PrivacyTip />}
            iconPosition="start"
            label={isArabic ? "سياسة الخصوصية" : "Privacy Policy"}
          />
        </Tabs>

        {/* Tab 1: Terms & Conditions */}
        {activeTab === "terms" && (
          <Stack spacing={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                {isArabic ? "بنود الشروط والأحكام" : "Terms & Conditions Items"}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenTermDialog()}
              >
                {isArabic ? "إضافة بند جديد" : "Add New Term Clause"}
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="60">{isArabic ? "الترتيب" : "Sort"}</TableCell>
                    <TableCell width="240" style={{ textAlign: "right" }}>{isArabic ? "عنوان البند" : "Title"}</TableCell>
                    <TableCell align="center">{isArabic ? "المحتوى" : "Content"}</TableCell>
                    <TableCell width="150">{isArabic ? "الحالة" : "Status"}</TableCell>
                    <TableCell width="100" align="center">
                      {isArabic ? "إجراءات" : "Actions"}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingTerms ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  ) : terms.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {isArabic ? "لا توجد بنود شروط وأحكام." : "No terms & conditions items."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    terms.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.sortOrder}</TableCell>
                        <TableCell style={{ textAlign: "right" }}>
                          <Typography variant="body2" style={{ textAlign: "right" }} sx={{ fontWeight: "bold" }}>
                            {item.titleAr}
                          </Typography>
                          {item.titleEn && (
                            <Typography variant="caption" color="text.secondary" style={{ textAlign: "right" }} sx={{ display: "block" }}>
                              {item.titleEn}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              textAlign: "center",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.contentAr}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "nowrap" }}>
                            <Chip
                              size="small"
                              label={item.isActive ? (isArabic ? "نشط" : "Active") : isArabic ? "مُعطل" : "Disabled"}
                              color={item.isActive ? "success" : "default"}
                              variant="outlined"
                            />
                            <Switch
                              size="small"
                              checked={item.isActive}
                              onChange={(e) =>
                                toggleTermActiveMutation.mutate({
                                  id: item.id,
                                  isActive: e.target.checked,
                                })
                              }
                            />
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenTermDialog(item)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (
                                window.confirm(
                                  isArabic
                                    ? "هل أنت تأكد من مسح هذا البند؟"
                                    : "Are you sure you want to delete this term clause?"
                                )
                              ) {
                                deleteTermMutation.mutate(item.id);
                              }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}

        {/* Tab 2: FAQ */}
        {activeTab === "faq" && (
          <Stack spacing={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                {isArabic ? "قائمة الأسئلة الشائعة" : "Frequently Asked Questions"}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => handleOpenFaqDialog()}
              >
                {isArabic ? "إضافة سؤال جديد" : "Add New FAQ Item"}
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell width="60">{isArabic ? "الترتيب" : "Sort"}</TableCell>
                    <TableCell width="240" style={{ textAlign: "right" }}>{isArabic ? "السؤال" : "Question"}</TableCell>
                    <TableCell align="center">{isArabic ? "الإجابة" : "Answer"}</TableCell>
                    <TableCell width="150">{isArabic ? "الحالة" : "Status"}</TableCell>
                    <TableCell width="100" align="center">
                      {isArabic ? "إجراءات" : "Actions"}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingFaqs ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {t("common.loading")}
                      </TableCell>
                    </TableRow>
                  ) : faqs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        {isArabic ? "لا توجد أسئلة شائعة." : "No FAQ items."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    faqs.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell>{item.sortOrder}</TableCell>
                        <TableCell style={{ textAlign: "right" }}>
                          <Typography variant="body2" style={{ textAlign: "right" }} sx={{ fontWeight: "bold" }}>
                            {item.questionAr}
                          </Typography>
                          {item.questionEn && (
                            <Typography variant="caption" color="text.secondary" style={{ textAlign: "right" }} sx={{ display: "block" }}>
                              {item.questionEn}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                              textAlign: "center",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                            }}
                          >
                            {item.answerAr}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "nowrap" }}>
                            <Chip
                              size="small"
                              label={item.isActive ? (isArabic ? "نشط" : "Active") : isArabic ? "مُعطل" : "Disabled"}
                              color={item.isActive ? "success" : "default"}
                              variant="outlined"
                            />
                            <Switch
                              size="small"
                              checked={item.isActive}
                              onChange={(e) =>
                                toggleFaqActiveMutation.mutate({
                                  id: item.id,
                                  isActive: e.target.checked,
                                })
                              }
                            />
                          </Stack>
                        </TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenFaqDialog(item)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => {
                              if (
                                window.confirm(
                                  isArabic
                                    ? "هل أنت تأكد من مسح هذا السؤال؟"
                                    : "Are you sure you want to delete this FAQ item?"
                                )
                              ) {
                                deleteFaqMutation.mutate(item.id);
                              }
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        )}

        {/* Tab 3: Privacy Policy */}
        {activeTab === "privacy" && (
          <Stack spacing={3}>
            {privacySuccess && (
              <Alert severity="success" onClose={() => setPrivacySuccess(false)}>
                {isArabic ? "تم حفظ سياسة الخصوصية بنجاح" : "Privacy Policy updated successfully"}
              </Alert>
            )}
            {privacyError && <Alert severity="error">{privacyError}</Alert>}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={isArabic ? "العنوان بالعربية *" : "Arabic Title *"}
                  value={privacyForm.titleAr || ""}
                  onChange={(e) => setPrivacyForm({ ...privacyForm, titleAr: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  label={isArabic ? "العنوان بالإنجليزية" : "English Title"}
                  value={privacyForm.titleEn || ""}
                  onChange={(e) => setPrivacyForm({ ...privacyForm, titleEn: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={6}
                  label={isArabic ? "المحتوى بالعربية *" : "Arabic Content *"}
                  value={privacyForm.contentAr || ""}
                  onChange={(e) => setPrivacyForm({ ...privacyForm, contentAr: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  multiline
                  minRows={6}
                  label={isArabic ? "المحتوى بالإنجليزية" : "English Content"}
                  value={privacyForm.contentEn || ""}
                  onChange={(e) => setPrivacyForm({ ...privacyForm, contentEn: e.target.value })}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={privacyForm.isPublished ?? true}
                      onChange={(e) => setPrivacyForm({ ...privacyForm, isPublished: e.target.checked })}
                    />
                  }
                  label={isArabic ? "نشر سياسة الخصوصية للمستخدمين" : "Publish Privacy Policy to app users"}
                />
              </Grid>
            </Grid>

            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                variant="contained"
                startIcon={<Save />}
                disabled={savePrivacyMutation.isPending || loadingPrivacy}
                onClick={() => savePrivacyMutation.mutate()}
              >
                {savePrivacyMutation.isPending
                  ? isArabic
                    ? "جاري الحفظ..."
                    : "Saving..."
                  : isArabic
                    ? "حفظ التغييرات"
                    : "Save Privacy Policy"}
              </Button>
            </Box>
          </Stack>
        )}
      </Paper>

      {/* Term Item Create/Edit Dialog */}
      <Dialog open={termDialogOpen} onClose={() => setTermDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingTerm
            ? isArabic
              ? "تعديل بند شروط وأحكام"
              : "Edit Term Clause"
            : isArabic
              ? "إضافة بند شروط وأحكام جديد"
              : "Add New Term Clause"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {termError && <Alert severity="error">{termError}</Alert>}
            <TextField
              fullWidth
              size="small"
              label={isArabic ? "عنوان البند (عربي) *" : "Title (Arabic) *"}
              value={termTitleAr}
              onChange={(e) => setTermTitleAr(e.target.value)}
            />
            <TextField
              fullWidth
              size="small"
              label={isArabic ? "عنوان البند (إنجليزي)" : "Title (English)"}
              value={termTitleEn}
              onChange={(e) => setTermTitleEn(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={4}
              label={isArabic ? "نص البند (عربي) *" : "Content (Arabic) *"}
              value={termContentAr}
              onChange={(e) => setTermContentAr(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={4}
              label={isArabic ? "نص البند (إنجليزي)" : "Content (English)"}
              value={termContentEn}
              onChange={(e) => setTermContentEn(e.target.value)}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={isArabic ? "ترتيب العرض" : "Sort Order"}
                  value={termSortOrder}
                  onChange={(e) => setTermSortOrder(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={termIsActive}
                      onChange={(e) => setTermIsActive(e.target.checked)}
                    />
                  }
                  label={isArabic ? "تفعيل البند" : "Active"}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTermDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            disabled={saveTermMutation.isPending}
            onClick={() => saveTermMutation.mutate()}
          >
            {saveTermMutation.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>

      {/* FAQ Item Create/Edit Dialog */}
      <Dialog open={faqDialogOpen} onClose={() => setFaqDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingFaq
            ? isArabic
              ? "تعديل سؤال شائع"
              : "Edit FAQ Item"
            : isArabic
              ? "إضافة سؤال شائع جديد"
              : "Add New FAQ Item"}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {faqError && <Alert severity="error">{faqError}</Alert>}
            <TextField
              fullWidth
              size="small"
              label={isArabic ? "السؤال (عربي) *" : "Question (Arabic) *"}
              value={faqQuestionAr}
              onChange={(e) => setFaqQuestionAr(e.target.value)}
            />
            <TextField
              fullWidth
              size="small"
              label={isArabic ? "السؤال (إنجليزي)" : "Question (English)"}
              value={faqQuestionEn}
              onChange={(e) => setFaqQuestionEn(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={isArabic ? "الإجابة (عربي) *" : "Answer (Arabic) *"}
              value={faqAnswerAr}
              onChange={(e) => setFaqAnswerAr(e.target.value)}
            />
            <TextField
              fullWidth
              multiline
              minRows={3}
              label={isArabic ? "الإجابة (إنجليزي)" : "Answer (English)"}
              value={faqAnswerEn}
              onChange={(e) => setFaqAnswerEn(e.target.value)}
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  type="number"
                  label={isArabic ? "ترتيب العرض" : "Sort Order"}
                  value={faqSortOrder}
                  onChange={(e) => setFaqSortOrder(Number(e.target.value))}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={faqIsActive}
                      onChange={(e) => setFaqIsActive(e.target.checked)}
                    />
                  }
                  label={isArabic ? "تفعيل السؤال" : "Active"}
                />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFaqDialogOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            disabled={saveFaqMutation.isPending}
            onClick={() => saveFaqMutation.mutate()}
          >
            {saveFaqMutation.isPending ? t("common.saving") : t("common.save")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

