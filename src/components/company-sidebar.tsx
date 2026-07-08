import type { SvgIconComponent } from "@mui/icons-material";
import { Business, Dashboard, Inventory2, Notifications } from "@mui/icons-material";
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
import { SIDEBAR_WIDTH_COLLAPSED, SIDEBAR_WIDTH_OPEN } from "./sidebar";

type NavItem = { to: string; labelKey: string; icon: SvgIconComponent; end?: boolean };

const sections: Array<{ titleKey: string; items: NavItem[] }> = [
  {
    titleKey: "nav.section.dashboard",
    items: [{ to: "/company", labelKey: "company.nav.dashboard", icon: Dashboard, end: true }],
  },
  {
    titleKey: "company.nav.section.catalog",
    items: [{ to: "/company/products", labelKey: "company.nav.products", icon: Inventory2 }],
  },
  {
    titleKey: "company.nav.section.account",
    items: [
      { to: "/company/profile", labelKey: "company.nav.profile", icon: Business },
      { to: "/company/notifications", labelKey: "company.nav.notifications", icon: Notifications },
    ],
  },
];

const sidebarScrollSx = {
  flex: 1,
  minHeight: 0,
  overflowY: "auto",
  overflowX: "hidden",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
  "&::-webkit-scrollbar": { display: "none" },
} as const;

function isActivePath(pathname: string, to: string, end?: boolean) {
  if (end) return pathname === to;
  return pathname === to || pathname.startsWith(`${to}/`);
}

function CompanySidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { sidebarOpen } = useUiStore();
  const { t } = useI18n();
  const location = useLocation();

  return (
    <Stack spacing={0.75} sx={{ px: 0.75, py: 0.75 }}>
      {sections.map((section) => (
        <Box key={section.titleKey}>
          {sidebarOpen ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                px: 1,
                pt: 0.75,
                pb: 0.25,
                display: "block",
                fontWeight: 700,
                fontSize: "0.65rem",
                letterSpacing: 0.8,
                textTransform: "uppercase",
              }}
            >
              {t(section.titleKey)}
            </Typography>
          ) : null}
          <List dense disablePadding>
            {section.items.map((item) => {
              const active = isActivePath(location.pathname, item.to, item.end);
              const Icon = item.icon;
              return (
                <ListItemButton
                  key={item.to}
                  component={NavLink}
                  to={item.to}
                  end={item.end}
                  onClick={onNavigate}
                  selected={active}
                  sx={{
                    mb: 0.25,
                    borderRadius: 1.5,
                    justifyContent: sidebarOpen ? "initial" : "center",
                    px: sidebarOpen ? 1.25 : 0.75,
                    py: 0.5,
                    minHeight: 36,
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      "& .MuiListItemIcon-root": { color: "inherit" },
                      "&:hover": { bgcolor: "primary.dark" },
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: sidebarOpen ? 32 : 0,
                      justifyContent: "center",
                      color: active ? "inherit" : "text.secondary",
                    }}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                  </ListItemIcon>
                  {sidebarOpen ? (
                    <ListItemText
                      primary={t(item.labelKey)}
                      slotProps={{
                        primary: { sx: { fontSize: "0.8125rem", fontWeight: active ? 600 : 500 } },
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

function CompanySidebarShell({
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
          px: sidebarOpen ? 1.25 : 0.75,
          py: 1.25,
          borderBottom: 1,
          borderColor: "divider",
        }}
      >
        <Stack
          direction="row"
          spacing={sidebarOpen ? 1 : 0}
          sx={{
            alignItems: "center",
            justifyContent: sidebarOpen ? "flex-start" : "center",
          }}
        >
          <AppLogo size={sidebarOpen ? 32 : 28} showLabel={sidebarOpen} />
        </Stack>
      </Box>

      <Box sx={sidebarScrollSx}>
        <CompanySidebarNav onNavigate={onNavigate} />
      </Box>
    </Box>
  );
}

export function CompanySidebar() {
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
        sx={{ "& .MuiDrawer-paper": { width: SIDEBAR_WIDTH_OPEN, overflow: "hidden" } }}
      >
        <CompanySidebarShell mobile onNavigate={() => setSidebarOpen(false)} />
      </Drawer>
    );
  }

  return (
    <Box
      component="nav"
      aria-label="company-sidebar"
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
          transition: (theme) =>
            theme.transitions.create("width", { duration: theme.transitions.duration.shortest }),
        }}
      >
        <CompanySidebarShell />
      </Box>
    </Box>
  );
}
