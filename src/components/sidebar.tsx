import type { SvgIconComponent } from "@mui/icons-material";
import {
  AdminPanelSettings,
  Campaign,
  Category,
  CorporateFare,
  Dashboard,
  HowToReg,
  Inventory2,
  Notifications,
  PendingActions,
  People,
  Scale,
  Settings,
  ShoppingCart,
  ShowChart,
  SmartToy,
  WbSunny,
  AccountBalance,
  Article,
} from "@mui/icons-material";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import { AppLogo } from "./branding";
import { useUiStore } from "../store/ui-store";
import { useI18n } from "../hooks/use-i18n";
import { usePermission } from "../store/permission-context";

export const SIDEBAR_WIDTH_OPEN = 248;
export const SIDEBAR_WIDTH_COLLAPSED = 68;

type NavItem = { to: string; labelKey: string; icon: SvgIconComponent; permission?: string };

const sections: Array<{ titleKey: string; items: NavItem[] }> = [
  {
    titleKey: "nav.section.dashboard",
    items: [{ to: "/", labelKey: "nav.dashboard", icon: Dashboard, permission: "dashboard.view" }],
  },
  {
    titleKey: "nav.section.management",
    items: [
      { to: "/users", labelKey: "nav.users", icon: People, permission: "users.view" },
      { to: "/companies", labelKey: "nav.companies", icon: CorporateFare, permission: "companies.view" },
      { to: "/join-requests", labelKey: "nav.joinRequests", icon: HowToReg, permission: "companies.view" },
      { to: "/products", labelKey: "nav.products", icon: Inventory2, permission: "products.view" },
      { to: "/pending-products", labelKey: "nav.pendingProducts", icon: PendingActions, permission: "products.view" },
      { to: "/categories", labelKey: "nav.categories", icon: Category, permission: "categories.view" },
      { to: "/units", labelKey: "nav.units", icon: Scale, permission: "categories.view" },
      { to: "/orders", labelKey: "nav.orders", icon: ShoppingCart, permission: "orders.view" },
      { to: "/finance", labelKey: "nav.finance", icon: AccountBalance, permission: "finance.view" },
    ],
  },
  {
    titleKey: "nav.section.content",
    items: [
      { to: "/banners", labelKey: "nav.banners", icon: Campaign, permission: "banners.view" },
      { to: "/notifications", labelKey: "nav.notifications", icon: Notifications, permission: "notifications.view" },
      { to: "/content-management", labelKey: "nav.contentManagement", icon: Article, permission: "settings.view" },
    ],
  },
  {
    titleKey: "nav.section.services",
    items: [
      { to: "/consultants", labelKey: "nav.consultants", icon: People, permission: "consultants.view" },
      { to: "/ai-settings", labelKey: "nav.aiSettings", icon: SmartToy, permission: "settings.view" },
      { to: "/market", labelKey: "nav.market", icon: ShowChart, permission: "settings.view" },
      { to: "/weather-settings", labelKey: "nav.weatherSettings", icon: WbSunny, permission: "settings.view" },
    ],
  },
  {
    titleKey: "nav.section.system",
    items: [
      { to: "/system-settings", labelKey: "nav.systemSettings", icon: Settings, permission: "settings.view" },
      { to: "/roles-permissions", labelKey: "nav.rolesPermissions", icon: AdminPanelSettings, permission: "roles.view" },
    ],
  },
];

const sidebarScrollSx = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarWidth: "thin" as const,
  scrollbarColor: "transparent transparent",
  "&:hover": { scrollbarColor: "#C5D0C8 transparent" },
  "&::-webkit-scrollbar": { width: 4 },
  "&::-webkit-scrollbar-thumb": { backgroundColor: "transparent", borderRadius: 8 },
  "&:hover::-webkit-scrollbar-thumb": { backgroundColor: "#C5D0C8" },
};

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { sidebarOpen } = useUiStore();
  const { t } = useI18n();
  const { hasPermission } = usePermission();
  const location = useLocation();
  const theme = useTheme();

  const visibleSections = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => !item.permission || hasPermission(item.permission)),
    }))
    .filter((section) => section.items.length > 0);

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname === to || location.pathname.startsWith(`${to}/`);
  };

  return (
    <Stack spacing={0.5} sx={{ px: 1, py: 1 }}>
      {visibleSections.map((section) => (
        <Box key={section.titleKey} sx={{ mb: 0.5 }}>
          {sidebarOpen ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                px: 1.25,
                pt: 1,
                pb: 0.5,
                display: "block",
                fontWeight: 600,
                fontSize: "0.65rem",
                letterSpacing: 0.6,
                textTransform: "uppercase",
              }}
            >
              {t(section.titleKey)}
            </Typography>
          ) : null}
          <List dense disablePadding>
            {section.items.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <ListItemButton
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  end={item.to === "/"}
                  onClick={onNavigate}
                  selected={active}
                  sx={{
                    mb: 0.25,
                    borderRadius: "8px",
                    justifyContent: sidebarOpen ? "initial" : "center",
                    px: sidebarOpen ? 1.25 : 0.75,
                    py: 0.75,
                    minHeight: 38,
                    position: "relative",
                    color: active ? "primary.main" : "text.primary",
                    bgcolor: active
                      ? theme.palette.mode === "dark"
                        ? "rgba(77, 154, 91, 0.14)"
                        : "rgba(35, 103, 58, 0.08)"
                      : "transparent",
                    "&::before": active
                      ? {
                          content: '""',
                          position: "absolute",
                          insetInlineStart: 0,
                          top: 8,
                          bottom: 8,
                          width: 3,
                          borderRadius: "0 2px 2px 0",
                          bgcolor: "primary.main",
                        }
                      : undefined,
                    "&.Mui-selected": {
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(77, 154, 91, 0.14)"
                          : "rgba(35, 103, 58, 0.08)",
                      color: "primary.main",
                      "& .MuiListItemIcon-root": { color: "primary.main" },
                      "&:hover": {
                        bgcolor:
                          theme.palette.mode === "dark"
                            ? "rgba(77, 154, 91, 0.18)"
                            : "rgba(35, 103, 58, 0.12)",
                      },
                    },
                    "&:hover": {
                      bgcolor:
                        theme.palette.mode === "dark"
                          ? "rgba(255,255,255,0.04)"
                          : "rgba(15, 23, 42, 0.04)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: sidebarOpen ? 32 : 0,
                      justifyContent: "center",
                      color: active ? "primary.main" : "text.secondary",
                    }}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                  </ListItemIcon>
                  {sidebarOpen ? (
                    <ListItemText
                      primary={t(item.labelKey)}
                      slotProps={{
                        primary: {
                          sx: { fontSize: "0.8125rem", fontWeight: active ? 600 : 500 },
                        },
                      }}
                    />
                  ) : null}
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      ))}
    </Stack>
  );
}

function SidebarShell({
  onNavigate,
  mobile,
}: {
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  const { sidebarOpen } = useUiStore();

  return (
    <Box
      sx={{
        height: mobile ? "100%" : "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        bgcolor: "background.paper",
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          px: sidebarOpen ? 1.5 : 0.75,
          py: 1.5,
          borderBottom: 1,
          borderColor: "divider",
          minHeight: 56,
          display: "flex",
          alignItems: "center",
        }}
      >
        <Stack
          direction="row"
          spacing={sidebarOpen ? 1 : 0}
          sx={{
            alignItems: "center",
            justifyContent: sidebarOpen ? "flex-start" : "center",
            width: "100%",
          }}
        >
          <AppLogo size={sidebarOpen ? 28 : 26} showLabel={sidebarOpen} />
        </Stack>
      </Box>

      <Box sx={sidebarScrollSx}>
        <SidebarNav onNavigate={onNavigate} />
      </Box>
    </Box>
  );
}

export function Sidebar() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const { sidebarOpen, setSidebarOpen, direction } = useUiStore();
  const drawerWidth = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_COLLAPSED;
  const anchor = direction === "rtl" ? "right" : "left";

  if (!isDesktop) {
    return (
      <Drawer
        anchor={anchor}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH_OPEN, overflow: "hidden", borderRadius: 0 } }}
      >
        <SidebarShell mobile onNavigate={() => setSidebarOpen(false)} />
      </Drawer>
    );
  }

  return (
    <Box
      component="nav"
      aria-label="sidebar"
      sx={{
        width: 0,
        flexShrink: 0,
        display: { xs: "none", lg: "block" },
      }}
    >
      <Box
        sx={{
          position: "fixed",
          top: 0,
          insetInlineStart: 0,
          width: drawerWidth,
          height: "100vh",
          overflow: "hidden",
          zIndex: (theme) => theme.zIndex.drawer,
          borderInlineEnd: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
          transition: (theme) =>
            theme.transitions.create("width", { duration: theme.transitions.duration.shortest }),
        }}
      >
        <SidebarShell />
      </Box>
    </Box>
  );
}
