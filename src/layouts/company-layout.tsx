import { Outlet, useNavigate } from "react-router-dom";
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from "@mui/material";
import { AppLogo } from "../components/branding";
import { useI18n } from "../hooks/use-i18n";
import { useAuth } from "../store/auth-store";
import { useUiStore } from "../store/ui-store";

export function CompanyLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const { direction } = useUiStore();

  return (
    <Box dir={direction} sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar>
          <AppLogo size={32} showLabel />
          <Stack spacing={0.25} sx={{ flex: 1, ml: 2, display: { xs: "none", sm: "flex" } }}>
            <Typography variant="caption" color="text.secondary">
              {user?.name}
            </Typography>
          </Stack>
          <Button
            variant="outlined"
            onClick={() => {
              logout();
              navigate("/login");
            }}
          >
            {t("common.logout")}
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Outlet />
      </Container>
    </Box>
  );
}
