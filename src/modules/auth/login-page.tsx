import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link as RouterLink, useLocation, useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ChevronRight, Visibility, VisibilityOff } from "@mui/icons-material";
import { AppLogo, AuthChrome } from "../../components/branding";
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

  const schema = useMemo(
    () =>
      z.object({
        email: z.string().email(t("login.emailInvalid")),
        password: z.string().min(6, t("login.passwordMin")),
        rememberMe: z.boolean(),
      }),
    [t]
  );

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
        stored?.role === "COMPANY" ? "/company/products" : redirectTo === "/company/products" ? "/" : redirectTo;
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
          {t("login.footer")}
        </Typography>
      }
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 440,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
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
              <Alert severity="error" variant="outlined" sx={{ borderRadius: 2 }}>
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

            <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
              <FormControlLabel
                control={<Checkbox {...form.register("rememberMe")} defaultChecked />}
                label={<Typography variant="body2">{t("login.rememberMe")}</Typography>}
              />
              <Link component={RouterLink} to="/forgot-password" underline="hover" variant="body2">
                {t("login.forgotPassword")}
              </Link>
            </Stack>
          </Stack>
        </Box>
      </Paper>
    </AuthChrome>
  );
}
