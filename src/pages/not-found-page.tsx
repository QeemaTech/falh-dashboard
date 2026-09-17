import { HomeOutlined, SearchOffOutlined } from "@mui/icons-material";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink, useRouteError, isRouteErrorResponse } from "react-router-dom";
import { useI18n } from "../hooks/use-i18n";
import { AppLogo } from "../components/branding";

export function NotFoundPage() {
  const { t } = useI18n();

  return (
    <Box
      sx={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        px: 2,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 480,
          borderRadius: "8px",
          borderColor: "divider",
          p: { xs: 3, md: 4 },
          textAlign: "center",
        }}
      >
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: "8px",
              display: "grid",
              placeItems: "center",
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "rgba(77, 154, 91, 0.12)" : "rgba(35, 103, 58, 0.08)",
              color: "primary.main",
            }}
          >
            <SearchOffOutlined sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="overline" color="text.secondary" sx={{ letterSpacing: 1.5, fontWeight: 700 }}>
            404
          </Typography>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t("common.notFoundTitle", "Page not found")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("common.notFoundDescription", "The page you are looking for does not exist or was moved.")}
          </Typography>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            startIcon={<HomeOutlined />}
            sx={{ borderRadius: "8px", mt: 1 }}
          >
            {t("common.goHome", "Back to dashboard")}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}

export function RouteErrorPage() {
  const { t } = useI18n();
  const error = useRouteError();
  const message = isRouteErrorResponse(error)
    ? error.statusText || error.data
    : error instanceof Error
      ? error.message
      : t("common.somethingWrong", "Something went wrong");

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        px: 2,
        bgcolor: "background.default",
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 480,
          borderRadius: "8px",
          borderColor: "divider",
          p: { xs: 3, md: 4 },
          textAlign: "center",
        }}
      >
        <Stack spacing={2} sx={{ alignItems: "center" }}>
          <AppLogo size={40} />
          <Typography variant="h5" sx={{ fontWeight: 700 }}>
            {t("common.somethingWrong", "Something went wrong")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {String(message)}
          </Typography>
          <Button
            component={RouterLink}
            to="/"
            variant="contained"
            startIcon={<HomeOutlined />}
            sx={{ borderRadius: "8px" }}
          >
            {t("common.goHome", "Back to dashboard")}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
