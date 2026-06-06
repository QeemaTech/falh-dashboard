import { DarkMode, ExpandMore, LightMode, Logout } from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useUiStore } from "../store/ui-store";
import { useAuth } from "../store/auth-store";
import { AppAvatar } from "./design-system";
import { useI18n } from "../hooks/use-i18n";
import { useDropdown } from "../hooks/use-dropdown";
import { useColorMode } from "../theme/useColorMode";

type Props = {
  onOpen?: () => void;
  dropdown?: ReturnType<typeof useDropdown>;
};

export function UserMenu({ onOpen, dropdown: externalDropdown }: Props) {
  const theme = useTheme();
  const internalDropdown = useDropdown();
  const { open, close, toggle, containerRef } = externalDropdown ?? internalDropdown;
  const { mode, toggleColorMode } = useColorMode();
  const { language, setLanguage } = useUiStore();
  const { t } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const name = user?.name || "Admin User";
  const menuAnchorHorizontal = theme.direction === "rtl" ? "left" : "right";

  const handleToggle = () => {
    if (!open) onOpen?.();
    toggle();
  };

  return (
    <Box ref={containerRef}>
      <Button
        onClick={handleToggle}
        variant="outlined"
        color="inherit"
        endIcon={<ExpandMore fontSize="small" />}
        sx={{ borderRadius: 3, px: 1.5, py: 0.75, textTransform: "none" }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
          <AppAvatar name={name} size="sm" />
          <Box sx={{ display: { xs: "none", sm: "block" }, textAlign: "start" }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t("menu.superAdmin")}
            </Typography>
          </Box>
        </Stack>
      </Button>

      <Menu
        anchorEl={containerRef.current}
        open={open}
        onClose={close}
        anchorOrigin={{ vertical: "bottom", horizontal: menuAnchorHorizontal }}
        transformOrigin={{ vertical: "top", horizontal: menuAnchorHorizontal }}
      >
        <MenuItem onClick={toggleColorMode}>
          {mode === "dark" ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          <Typography sx={{ ml: 1.5 }}>{mode === "dark" ? t("menu.lightMode") : t("menu.darkMode")}</Typography>
        </MenuItem>
        <Divider />
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t("menu.language")}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              size="small"
              variant={language === "ar" ? "contained" : "outlined"}
              onClick={() => {
                setLanguage("ar");
                close();
              }}
            >
              {t("menu.arabic")}
            </Button>
            <Button
              size="small"
              variant={language === "en" ? "contained" : "outlined"}
              onClick={() => {
                setLanguage("en");
                close();
              }}
            >
              {t("menu.english")}
            </Button>
          </Stack>
        </Box>
        <Divider />
        <MenuItem
          onClick={() => {
            close();
            logout();
            navigate("/login", { replace: true });
          }}
          sx={{ color: "error.main" }}
        >
          <Logout fontSize="small" />
          <Typography sx={{ ml: 1.5 }}>{t("common.logout")}</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
