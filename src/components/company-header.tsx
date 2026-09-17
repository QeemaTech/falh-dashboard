import { Menu } from "@mui/icons-material";
import { AppBar, Box, IconButton, Stack, Toolbar } from "@mui/material";
import { SearchBar } from "./search-bar";
import { UserMenu } from "./user-menu";
import { NotificationMenu } from "./notification-menu";
import { useGlobalSearch } from "../hooks/use-global-search";
import { useUiStore } from "../store/ui-store";
import { Breadcrumbs } from "./breadcrumbs";
import { useDropdown } from "../hooks/use-dropdown";
import { useI18n } from "../hooks/use-i18n";

export function CompanyHeader() {
  const userMenu = useDropdown();
  const notificationMenu = useDropdown();
  const { search, setSearch } = useGlobalSearch();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const { t } = useI18n();

  return (
    <AppBar
      position="sticky"
      color="inherit"
      sx={{ width: "100%", borderBottom: 1, borderColor: "divider", bgcolor: "background.paper" }}
    >
      <Toolbar
        sx={{
          minHeight: { xs: 56, sm: 60 },
          px: { xs: 1.5, md: 3 },
          gap: { xs: 1, md: 2 },
          alignItems: "center",
        }}
      >
        <IconButton
          edge="start"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label="menu"
          size="small"
          sx={{ borderRadius: "8px", border: 1, borderColor: "divider", width: 36, height: 36 }}
        >
          <Menu fontSize="small" />
        </IconButton>

        <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden", display: { xs: "none", sm: "block" } }}>
          <Breadcrumbs homeTo="/company" />
        </Box>

        <Box sx={{ width: { xs: "100%", sm: 220, md: 260 }, flexShrink: 0, maxWidth: 280 }}>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder={t("company.search.placeholder")}
          />
        </Box>

        <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexShrink: 0 }}>
          <NotificationMenu
            dropdown={notificationMenu}
            onOpen={userMenu.close}
            viewAllPath="/company/notifications"
          />
          <UserMenu dropdown={userMenu} onOpen={notificationMenu.close} />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
