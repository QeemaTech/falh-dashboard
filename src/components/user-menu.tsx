import { DarkMode, ExpandMore, LightMode, Logout } from "@mui/icons-material";
import {
  Box,
  Button,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
  useMediaQuery,
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
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));
  const internalDropdown = useDropdown();
  const { open, close, toggle, containerRef, anchorEl } = externalDropdown ?? internalDropdown;
  const { mode, toggleColorMode } = useColorMode();
  const { language, setLanguage } = useUiStore();
  const { t } = useI18n();
  const { user, logout, isCompany } = useAuth();
  const navigate = useNavigate();

  const name = user?.name || (isCompany ? t("menu.companyUser") : "Admin User");
  const roleLabel = isCompany ? t("menu.companyAccount") : t("menu.superAdmin");
  const menuAnchorHorizontal = theme.direction === "rtl" ? "left" : "right";

  const handleToggle = () => {
    if (!open) onOpen?.();
    toggle();
  };

  return (
    <Box ref={containerRef}>
      {isCompact ? (
        <IconButton
          onClick={handleToggle}
          size="small"
          sx={{
            width: 38,
            height: 38,
            borderRadius: "8px",
            border: "1px solid",
            borderColor: "divider",
            p: 0.25,
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: (th) =>
                th.palette.mode === "dark" ? "rgba(77, 154, 91, 0.12)" : "rgba(35, 103, 58, 0.06)",
            },
          }}
        >
          <AppAvatar name={name} size="sm" />
        </IconButton>
      ) : (
        <Button
          onClick={handleToggle}
          color="inherit"
          endIcon={<ExpandMore sx={{ fontSize: 18, color: "text.secondary" }} />}
          sx={{
            borderRadius: "8px",
            px: 1,
            py: 0.5,
            minHeight: 38,
            textTransform: "none",
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "background.paper",
            "&:hover": {
              borderColor: "primary.main",
              bgcolor: (th) =>
                th.palette.mode === "dark" ? "rgba(77, 154, 91, 0.08)" : "rgba(35, 103, 58, 0.04)",
            },
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <AppAvatar name={name} size="sm" />
            <Box sx={{ textAlign: "start", maxWidth: 120 }}>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  fontSize: "0.8125rem",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {name}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  lineHeight: 1.2,
                  display: "block",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {roleLabel}
              </Typography>
            </Box>
          </Stack>
        </Button>
      )}

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={close}
        disableScrollLock
        anchorOrigin={{ vertical: "bottom", horizontal: menuAnchorHorizontal }}
        transformOrigin={{ vertical: "top", horizontal: menuAnchorHorizontal }}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "8px",
              mt: 1,
              minWidth: 240,
              border: "1px solid",
              borderColor: "divider",
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {roleLabel}
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={toggleColorMode} sx={{ gap: 1.5, py: 1.25 }}>
          {mode === "dark" ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          <Typography variant="body2">
            {mode === "dark" ? t("menu.lightMode") : t("menu.darkMode")}
          </Typography>
        </MenuItem>
        <Divider />
        <Box sx={{ px: 2, py: 1.25 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            {t("menu.language")}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
            <Button
              size="small"
              fullWidth
              variant={language === "ar" ? "contained" : "outlined"}
              onClick={() => {
                setLanguage("ar");
                close();
              }}
              sx={{ borderRadius: "8px" }}
            >
              {t("menu.arabic")}
            </Button>
            <Button
              size="small"
              fullWidth
              variant={language === "en" ? "contained" : "outlined"}
              onClick={() => {
                setLanguage("en");
                close();
              }}
              sx={{ borderRadius: "8px" }}
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
          sx={{ color: "error.main", gap: 1.5, py: 1.25 }}
        >
          <Logout fontSize="small" />
          <Typography variant="body2">{t("common.logout")}</Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
}
