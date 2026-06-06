import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { AppLogo, AuthChrome } from "../../components/branding";
import { useI18n } from "../../hooks/use-i18n";

export function ForgotPasswordPage() {
  const { t } = useI18n();

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
        }}
      >
        <Stack spacing={2.5} sx={{ alignItems: "center", textAlign: "center" }}>
          <AppLogo size={48} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {t("login.forgot.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t("login.forgot.subtitle")}
            </Typography>
          </Box>
          <Button component={RouterLink} to="/login" variant="contained" fullWidth sx={{ mt: 1 }}>
            {t("login.forgot.back")}
          </Button>
        </Stack>
      </Paper>
    </AuthChrome>
  );
}
