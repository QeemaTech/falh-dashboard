import { Menu, Notifications } from "@mui/icons-material";
import {
  AppBar,
  Badge,
  Box,
  IconButton,
  Menu as MuiMenu,
  MenuItem,
  Stack,
  Toolbar,
  Typography,
  useTheme,
} from "@mui/material";
import { SearchBar } from "./search-bar";
import { UserMenu } from "./user-menu";
import { useGlobalSearch } from "../hooks/use-global-search";
import { useUiStore } from "../store/ui-store";
import { Breadcrumbs } from "./breadcrumbs";
import { useI18n } from "../hooks/use-i18n";
import { useDropdown } from "../hooks/use-dropdown";

export function Header() {
  const theme = useTheme();
  const notifications = useDropdown();
  const userMenu = useDropdown();
  const { search, setSearch } = useGlobalSearch();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const { t } = useI18n();
  const menuAnchorHorizontal = theme.direction === "rtl" ? "left" : "right";
  const notificationItems = [
    t("header.notification.pendingProducts"),
    t("header.notification.newOrders"),
    t("header.notification.serverHealth"),
  ];

  return (
    <AppBar position="sticky" color="inherit" sx={{ width: "100%" }}>
      <Toolbar sx={{ flexDirection: "column", alignItems: "stretch", py: 1, gap: 0.75, minHeight: 56 }}>
        <Stack direction="row" spacing={1.5} sx={{ width: "100%", alignItems: "center" }}>
          <IconButton edge="start" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="menu">
            <Menu />
          </IconButton>
          <Box sx={{ flex: 1, maxWidth: 560 }}>
            <SearchBar value={search} onChange={setSearch} />
          </Box>
          <Box ref={notifications.containerRef}>
            <IconButton onClick={notifications.toggle} aria-label="notifications">
              <Badge color="primary" variant="dot">
                <Notifications />
              </Badge>
            </IconButton>
            <MuiMenu
              anchorEl={notifications.containerRef.current}
              open={notifications.open}
              onClose={notifications.close}
              anchorOrigin={{ vertical: "bottom", horizontal: menuAnchorHorizontal }}
              transformOrigin={{ vertical: "top", horizontal: menuAnchorHorizontal }}
            >
              <Box sx={{ px: 2, py: 1, minWidth: 280 }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700 }}>
                  {t("common.notifications")}
                </Typography>
              </Box>
              {notificationItems.map((notification) => (
                <MenuItem key={notification} onClick={notifications.close}>
                  <Typography variant="body2">{notification}</Typography>
                </MenuItem>
              ))}
            </MuiMenu>
          </Box>
          <UserMenu dropdown={userMenu} onOpen={notifications.close} />
        </Stack>
        <Breadcrumbs />
      </Toolbar>
    </AppBar>
  );
}
