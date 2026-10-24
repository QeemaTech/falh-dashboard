import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Business, CheckCircle, ChevronRight, Visibility, VisibilityOff } from "@mui/icons-material";
import { AppLogo, AuthChrome } from "../../components/branding";
import { AppModal } from "../../components/design-system";
import { governorateOptions } from "../../constants/egypt-governorates";
import { submitCompanyJoinApplicationApi } from "../../services/join-us-api";
import { getApiErrorMessage } from "../../utils/api-error";
import { useBranding } from "../../hooks/use-branding";
import { useI18n } from "../../hooks/use-i18n";
import { useAuth } from "../../store/auth-store";
import { getStoredUser } from "../../services/auth-storage";

type FormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

export function LoginPage() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t, language } = useI18n();
  const { footerText } = useBranding();

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("login.emailInvalid")),
        password: z.string().min(6, t("login.passwordMin")),
        rememberMe: z.boolean(),
      }),
    [t]
  );

  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [joinSubmitted, setJoinSubmitted] = useState(false);
  const [joinLoading, setJoinLoading] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinForm, setJoinForm] = useState({
    companyName: "",
    fullName: "",
    phone: "",
    email: "",
    city: "",
    whatsappNumber: "",
    description: "",
  });

  const governorates = useMemo(() => governorateOptions(language), [language]);

  const handleCloseJoinModal = () => {
    setJoinModalOpen(false);
  };

  const handleOpenJoinModal = () => {
    setJoinModalOpen(true);
    setJoinSubmitted(false);
    setJoinError(null);
  };

  const handleJoinSubmit = async () => {
    setJoinError(null);
    if (!joinForm.companyName.trim()) {
      setJoinError(language === "ar" ? "اسم الشركة مطلوب" : "Company name is required");
      return;
    }
    if (!joinForm.fullName.trim()) {
      setJoinError(
        language === "ar"
          ? "اسم المفوض / ممثل الشركة مطلوب"
          : "Representative name is required"
      );
      return;
    }
    if (!joinForm.phone.trim() || joinForm.phone.trim().length < 8) {
      setJoinError(
        language === "ar"
          ? "رقم الهاتف غير صحيح (8 أرقام على الأقل)"
          : "Phone number must be at least 8 digits"
      );
      return;
    }
    if (!joinForm.city.trim()) {
      setJoinError(
        language === "ar"
          ? "يرجى اختيار المحافظة / المدينة"
          : "Please select governorate / city"
      );
      return;
    }

    setJoinLoading(true);
    try {
      await submitCompanyJoinApplicationApi({
        companyName: joinForm.companyName,
        fullName: joinForm.fullName,
        phone: joinForm.phone,
        email: joinForm.email,
        city: joinForm.city,
        whatsappNumber: joinForm.whatsappNumber,
        description: joinForm.description,
      });
      setJoinSubmitted(true);
      setJoinForm({
        companyName: "",
        fullName: "",
        phone: "",
        email: "",
        city: "",
        whatsappNumber: "",
        description: "",
      });
    } catch (err) {
      setJoinError(
        getApiErrorMessage(
          err,
          language === "ar" ? "فشل إرسال طلب الانضمام" : "Failed to submit application"
        )
      );
    } finally {
      setJoinLoading(false);
    }
  };

  const redirectTo = (location.state as { from?: string } | undefined)?.from || "/";

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", rememberMe: true },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      await login(values);
      const stored = getStoredUser();
      const target =
        stored?.role === "COMPANY"
          ? redirectTo?.startsWith("/company")
            ? redirectTo
            : "/company"
          : redirectTo?.startsWith("/company")
            ? "/"
            : redirectTo;
      navigate(target, { replace: true });
    } catch (error) {
      const message =
        error && typeof error === "object" && "response" in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : null;
      setServerError(message || t("login.failed"));
    }
  });

  return (
    <AuthChrome
      footer={
        <Typography variant="caption" color="text.disabled">
          {footerText || t("login.footer")}
        </Typography>
      }
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          borderRadius: "8px",
          border: 1,
          borderColor: "divider",
          boxShadow: (theme) =>
            theme.palette.mode === "light"
              ? "0 24px 48px -24px rgba(15, 23, 42, 0.18)"
              : "0 24px 48px -24px rgba(0, 0, 0, 0.45)",
        }}
      >
        <Stack spacing={3} sx={{ alignItems: "center", textAlign: "center" }}>
          <AppLogo size={56} />
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {t("login.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
              {t("login.subtitle")}
            </Typography>
          </Box>
        </Stack>

        <Box component="form" key={language} onSubmit={onSubmit} sx={{ mt: 3.5 }}>
          <Stack spacing={2.5}>
            <TextField
              label={t("login.email")}
              type="email"
              placeholder={t("login.emailPlaceholder")}
              fullWidth
              autoComplete="email"
              error={Boolean(form.formState.errors.email)}
              helperText={form.formState.errors.email?.message}
              {...form.register("email")}
            />

            <TextField
              label={t("login.password")}
              type={showPassword ? "text" : "password"}
              placeholder={t("login.passwordPlaceholder")}
              fullWidth
              autoComplete="current-password"
              error={Boolean(form.formState.errors.password)}
              helperText={form.formState.errors.password?.message}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
                        onClick={() => setShowPassword((v) => !v)}
                        edge="end"
                        size="small"
                      >
                        {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
              {...form.register("password")}
            />

            {serverError ? (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: "8px" }}>
                {serverError}
              </Alert>
            ) : null}

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={form.formState.isSubmitting}
              endIcon={
                form.formState.isSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <ChevronRight />
                )
              }
              sx={{
                py: 1.25,
                "&:hover:not(:disabled)": { filter: "brightness(1.05)" },
              }}
            >
              {form.formState.isSubmitting ? t("login.signingIn") : t("login.signIn")}
            </Button>

            <Stack direction="row" sx={{ justifyContent: "flex-start", alignItems: "center" }}>
              <FormControlLabel
                control={<Checkbox {...form.register("rememberMe")} defaultChecked />}
                label={<Typography variant="body2">{t("login.rememberMe")}</Typography>}
              />
            </Stack>
          </Stack>
        </Box>

        <Divider sx={{ my: 3 }}>
          <Typography variant="caption" color="text.disabled">
            {language === "ar" ? "انضمام الشركات" : "Partner Companies"}
          </Typography>
        </Divider>

        <Stack spacing={1.5} sx={{ textAlign: "center", alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
            {t("login.companyJoin.prompt")}
          </Typography>
          <Button
            variant="outlined"
            color="primary"
            fullWidth
            onClick={handleOpenJoinModal}
            startIcon={<Business />}
            sx={{ py: 1, textTransform: "none", fontWeight: 600, borderRadius: "8px" }}
          >
            {t("login.companyJoin.button")}
          </Button>
          <Typography variant="caption" color="text.disabled" sx={{ lineHeight: 1.5 }}>
            {t("login.companyJoin.hint")}
          </Typography>
        </Stack>
      </Paper>

      <AppModal
        open={joinModalOpen}
        onClose={handleCloseJoinModal}
        title={t("login.companyJoin.modalTitle")}
        description={t("login.companyJoin.modalDesc")}
        maxWidth="sm"
        footer={
          joinSubmitted ? (
            <Button variant="contained" onClick={handleCloseJoinModal}>
              {t("login.companyJoin.close")}
            </Button>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={handleCloseJoinModal} disabled={joinLoading}>
                {language === "ar" ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                variant="contained"
                onClick={handleJoinSubmit}
                disabled={joinLoading}
                startIcon={joinLoading ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {joinLoading ? t("login.companyJoin.submitting") : t("login.companyJoin.submit")}
              </Button>
            </Stack>
          )
        }
      >
        {joinSubmitted ? (
          <Stack spacing={2} sx={{ py: 3, alignItems: "center", textAlign: "center" }}>
            <CheckCircle sx={{ fontSize: 64, color: "success.main" }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {t("login.companyJoin.successTitle")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 440 }}>
              {t("login.companyJoin.successMessage")}
            </Typography>
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ pt: 1 }}>
            {joinError ? (
              <Alert severity="error" variant="outlined" sx={{ borderRadius: "8px" }}>
                {joinError}
              </Alert>
            ) : null}

            <Alert severity="info" variant="outlined" sx={{ borderRadius: "8px" }}>
              {t("login.companyJoin.hint")}
            </Alert>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("login.companyJoin.companyName")}
                size="small"
                fullWidth
                required
                value={joinForm.companyName}
                onChange={(e) => setJoinForm((f) => ({ ...f, companyName: e.target.value }))}
                placeholder={language === "ar" ? "مثال: شركة وادي النيل الزراعية" : "e.g. Nile Valley Agri"}
              />
              <TextField
                label={t("login.companyJoin.applicantName")}
                size="small"
                fullWidth
                required
                value={joinForm.fullName}
                onChange={(e) => setJoinForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder={language === "ar" ? "اسم المسؤول أو المفوض" : "Representative name"}
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("login.companyJoin.phone")}
                size="small"
                fullWidth
                required
                value={joinForm.phone}
                onChange={(e) => setJoinForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="01xxxxxxxxx"
              />
              <TextField
                label={t("login.companyJoin.whatsapp")}
                size="small"
                fullWidth
                value={joinForm.whatsappNumber}
                onChange={(e) => setJoinForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
                placeholder="01xxxxxxxxx"
              />
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                label={t("login.companyJoin.email")}
                type="email"
                size="small"
                fullWidth
                value={joinForm.email}
                onChange={(e) => setJoinForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="company@example.com"
                helperText={
                  language === "ar"
                    ? "يُستخدم لاحقاً لتسجيل الدخول بعد اعتماد الحساب"
                    : "Used for login upon approval"
                }
              />
              <TextField
                select
                label={t("login.companyJoin.city")}
                size="small"
                fullWidth
                required
                value={joinForm.city}
                onChange={(e) => setJoinForm((f) => ({ ...f, city: e.target.value }))}
              >
                <MenuItem value="">
                  {language === "ar" ? "اختر المحافظة" : "Select Governorate"}
                </MenuItem>
                {governorates.map((g) => (
                  <MenuItem key={g.value} value={g.label}>
                    {g.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <TextField
              label={t("login.companyJoin.description")}
              size="small"
              fullWidth
              multiline
              rows={2}
              value={joinForm.description}
              onChange={(e) => setJoinForm((f) => ({ ...f, description: e.target.value }))}
              placeholder={
                language === "ar"
                  ? "نبذة مختصرة عن نشاط ومنتجات الشركة..."
                  : "Brief overview of company activity..."
              }
            />
          </Stack>
        )}
      </AppModal>
    </AuthChrome>
  );
}
