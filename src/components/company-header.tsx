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
    <AppBar position="sticky" color="inherit" sx={{ width: "100%" }}>
      <Toolbar sx={{ flexDirection: "column", alignItems: "stretch", py: 1, gap: 0.75, minHeight: 56 }}>
        <Stack direction="row" spacing={1.5} sx={{ width: "100%", alignItems: "center" }}>
          <IconButton edge="start" onClick={() => setSidebarOpen(!sidebarOpen)} aria-label="menu">
            <Menu />
          </IconButton>
          <Box sx={{ flex: 1, maxWidth: 560 }}>
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder={t("company.search.placeholder")}
            />
          </Box>
          <NotificationMenu
            dropdown={notificationMenu}
            onOpen={userMenu.close}
            viewAllPath="/company/notifications"
          />
          <UserMenu dropdown={userMenu} onOpen={notificationMenu.close} />
        </Stack>
        <Breadcrumbs homeTo="/company" />
      </Toolbar>
    </AppBar>
  );
}
