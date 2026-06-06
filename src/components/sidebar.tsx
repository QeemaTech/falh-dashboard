import type { SvgIconComponent } from "@mui/icons-material";
import {
  AdminPanelSettings,
  Campaign,
  Category,
  Dashboard,
  Inventory2,
  Notifications,
  People,
  Settings,
  ShoppingCart,
  ShowChart,
  SmartToy,
  Business,
  WbSunny,
} from "@mui/icons-material";
import {
  Box,
  Divider,
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

export const SIDEBAR_WIDTH_OPEN = 260;
export const SIDEBAR_WIDTH_COLLAPSED = 72;

type NavItem = { to: string; labelKey: string; icon: SvgIconComponent };

const sections: Array<{ titleKey: string; items: NavItem[] }> = [
  {
    titleKey: "nav.section.dashboard",
    items: [{ to: "/", labelKey: "nav.dashboard", icon: Dashboard }],
  },
  {
    titleKey: "nav.section.management",
    items: [
      { to: "/users", labelKey: "nav.users", icon: People },
      { to: "/companies", labelKey: "nav.companies", icon: Business },
      { to: "/join-requests", labelKey: "nav.joinRequests", icon: Business },
      { to: "/company-applications", labelKey: "nav.companyApplications", icon: Business },
      { to: "/products", labelKey: "nav.products", icon: Inventory2 },
      { to: "/pending-products", labelKey: "nav.pendingProducts", icon: Inventory2 },
      { to: "/categories", labelKey: "nav.categories", icon: Category },
      { to: "/orders", labelKey: "nav.orders", icon: ShoppingCart },
    ],
  },
  {
    titleKey: "nav.section.content",
    items: [
      { to: "/banners", labelKey: "nav.banners", icon: Campaign },
      { to: "/notifications", labelKey: "nav.notifications", icon: Notifications },
    ],
  },
  {
    titleKey: "nav.section.services",
    items: [
      { to: "/consultants", labelKey: "nav.consultants", icon: People },
      { to: "/ai-settings", labelKey: "nav.aiSettings", icon: SmartToy },
      { to: "/market", labelKey: "nav.market", icon: ShowChart },
      { to: "/weather-settings", labelKey: "nav.weatherSettings", icon: WbSunny },
    ],
  },
  {
    titleKey: "nav.section.system",
    items: [
      { to: "/system-settings", labelKey: "nav.systemSettings", icon: Settings },
      { to: "/roles-permissions", labelKey: "nav.rolesPermissions", icon: AdminPanelSettings },
    ],
  },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { sidebarOpen } = useUiStore();
  const { t } = useI18n();
  const location = useLocation();

  return (
    <Stack spacing={1.5} sx={{ px: 1, py: 1 }}>
      <Stack
        direction="row"
        spacing={sidebarOpen ? 1.5 : 0}
        sx={{
          mx: 0.5,
          p: 1.5,
          borderRadius: 3,
          bgcolor: "action.hover",
          alignItems: "center",
          justifyContent: sidebarOpen ? "flex-start" : "center",
        }}
      >
        <AppLogo size={sidebarOpen ? 36 : 32} showLabel={sidebarOpen} />
      </Stack>

      {sections.map((section) => (
        <Box key={section.titleKey}>
          {sidebarOpen ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ px: 1.5, py: 0.5, display: "block", fontWeight: 700, letterSpacing: 1.2 }}
            >
              {t(section.titleKey)}
            </Typography>
          ) : null}
          <List dense disablePadding>
            {section.items.map((item) => {
              const active = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <ListItemButton
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  onClick={onNavigate}
                  selected={active}
                  sx={{
                    mb: 0.5,
                    borderRadius: 2,
                    justifyContent: sidebarOpen ? "initial" : "center",
                    px: sidebarOpen ? 1.5 : 1,
                    minHeight: 44,
                  }}
                >
                  <ListItemIcon sx={{ minWidth: sidebarOpen ? 36 : 0, justifyContent: "center" }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  {sidebarOpen ? <ListItemText primary={t(item.labelKey)} /> : null}
                </ListItemButton>
              );
            })}
          </List>
        </Box>
      ))}
    </Stack>
  );
}

export function Sidebar() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const { sidebarOpen, setSidebarOpen, direction } = useUiStore();
  const drawerWidth = sidebarOpen ? SIDEBAR_WIDTH_OPEN : SIDEBAR_WIDTH_COLLAPSED;
  const anchor = direction === "rtl" ? "right" : "left";

  const paper = (
    <Box sx={{ height: "100%", overflow: "auto" }}>
      <SidebarNav onNavigate={() => !isDesktop && setSidebarOpen(false)} />
    </Box>
  );

  if (!isDesktop) {
    return (
      <Drawer
        anchor={anchor}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{ "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH_OPEN } }}
      >
        {paper}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="permanent"
      anchor={anchor}
      open
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          position: "relative",
          border: "none",
          bgcolor: "background.paper",
          borderRight: direction === "rtl" ? "none" : 1,
          borderLeft: direction === "rtl" ? 1 : "none",
          borderColor: "divider",
        },
      }}
    >
      <Divider />
      {paper}
    </Drawer>
  );
}
