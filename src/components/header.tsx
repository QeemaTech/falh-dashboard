import { useEffect, useRef, useState } from "react";
import { Close, Menu, Search } from "@mui/icons-material";
import {
  AppBar,
  Box,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { SearchBar } from "./search-bar";
import { UserMenu } from "./user-menu";
import { NotificationMenu } from "./notification-menu";
import { useGlobalSearch } from "../hooks/use-global-search";
import { useUiStore } from "../store/ui-store";
import { Breadcrumbs } from "./breadcrumbs";
import { useDropdown } from "../hooks/use-dropdown";
import { useI18n } from "../hooks/use-i18n";

export function Header() {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));
  const userMenu = useDropdown();
  const notificationMenu = useDropdown();
  const { search, setSearch } = useGlobalSearch();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const { t } = useI18n();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  return (
    <AppBar
      position="sticky"
      color="inherit"
      sx={{
        width: "100%",
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
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
          sx={{
            borderRadius: "8px",
            border: 1,
            borderColor: "divider",
            width: 36,
            height: 36,
          }}
        >
          <Menu fontSize="small" />
        </IconButton>

        {!searchOpen ? (
          <Box sx={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
            <Breadcrumbs />
          </Box>
        ) : null}

        {isCompact ? (
          searchOpen ? (
            <TextField
              inputRef={searchInputRef}
              fullWidth
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search.placeholder")}
              sx={{ flex: 1 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setSearchOpen(false);
                          setSearch("");
                        }}
                      >
                        <Close fontSize="small" />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: "8px" },
                },
              }}
            />
          ) : (
            <IconButton
              size="small"
              onClick={() => setSearchOpen(true)}
              aria-label={t("search.placeholder")}
              sx={{ borderRadius: "8px", border: 1, borderColor: "divider", width: 36, height: 36 }}
            >
              <Search fontSize="small" />
            </IconButton>
          )
        ) : (
          <Box sx={{ width: 260, flexShrink: 0 }}>
            <SearchBar value={search} onChange={setSearch} />
          </Box>
        )}

        {!searchOpen ? (
          <Stack direction="row" spacing={0.75} sx={{ alignItems: "center", flexShrink: 0 }}>
            <NotificationMenu dropdown={notificationMenu} onOpen={userMenu.close} />
            <UserMenu dropdown={userMenu} onOpen={notificationMenu.close} />
          </Stack>
        ) : null}
      </Toolbar>
    </AppBar>
  );
}
