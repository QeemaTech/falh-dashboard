import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
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
import { AppModal } from "../../components/design-system";
import { useI18n } from "../../hooks/use-i18n";
import {
  deleteAdminFaqApi,
  deleteAdminTermApi,
  fetchAdminFaqs,
  fetchAdminPrivacyPolicy,
  fetchAdminTerms,
  updateAdminFaqApi,
  updateAdminPrivacyPolicyApi,
  updateAdminTermApi,
  type PrivacyPolicy,
} from "../../services/admin-api";
import { getApiErrorMessage } from "../../utils/api-error";

type TabValue = "terms" | "faq" | "privacy";

export function ContentManagementPage() {
  const { t, isArabic } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabValue>("terms");
  const [confirmDeleteTermId, setConfirmDeleteTermId] = useState<string | null>(null);
  const [confirmDeleteFaqId, setConfirmDeleteFaqId] = useState<string | null>(null);

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

  const deleteTermMutation = useMutation({
    mutationFn: (termId: string) => deleteAdminTermApi(termId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-terms"] });
      setConfirmDeleteTermId(null);
    },
  });

  const toggleTermActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateAdminTermApi(id, { isActive }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-terms"] }),
  });

  const deleteFaqMutation = useMutation({
    mutationFn: (faqId: string) => deleteAdminFaqApi(faqId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-faqs"] });
      setConfirmDeleteFaqId(null);
    },
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
                onClick={() => navigate("/content-management/terms/new")}
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
                            onClick={() => navigate(`/content-management/terms/${item.id}/edit`)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setConfirmDeleteTermId(item.id)}
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
                onClick={() => navigate("/content-management/faq/new")}
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
                            onClick={() => navigate(`/content-management/faq/${item.id}/edit`)}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setConfirmDeleteFaqId(item.id)}
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

      <AppModal
        open={Boolean(confirmDeleteTermId)}
        onClose={() => setConfirmDeleteTermId(null)}
        title={isArabic ? "تأكيد الحذف" : "Confirm delete"}
        footer={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="error"
              disabled={deleteTermMutation.isPending}
              onClick={() => confirmDeleteTermId && deleteTermMutation.mutate(confirmDeleteTermId)}
              sx={{ borderRadius: "8px" }}
            >
              {t("common.delete", "Delete")}
            </Button>
            <Button onClick={() => setConfirmDeleteTermId(null)} sx={{ borderRadius: "8px" }}>
              {t("common.cancel", "Cancel")}
            </Button>
          </Stack>
        }
      >
        <Typography variant="body2">
          {isArabic ? "هل أنت متأكد من مسح هذا البند؟" : "Are you sure you want to delete this term clause?"}
        </Typography>
      </AppModal>

      <AppModal
        open={Boolean(confirmDeleteFaqId)}
        onClose={() => setConfirmDeleteFaqId(null)}
        title={isArabic ? "تأكيد الحذف" : "Confirm delete"}
        footer={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              color="error"
              disabled={deleteFaqMutation.isPending}
              onClick={() => confirmDeleteFaqId && deleteFaqMutation.mutate(confirmDeleteFaqId)}
              sx={{ borderRadius: "8px" }}
            >
              {t("common.delete", "Delete")}
            </Button>
            <Button onClick={() => setConfirmDeleteFaqId(null)} sx={{ borderRadius: "8px" }}>
              {t("common.cancel", "Cancel")}
            </Button>
          </Stack>
        }
      >
        <Typography variant="body2">
          {isArabic ? "هل أنت متأكد من مسح هذا السؤال؟" : "Are you sure you want to delete this FAQ item?"}
        </Typography>
      </AppModal>
    </Stack>
  );
}

