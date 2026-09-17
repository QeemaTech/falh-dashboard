import { useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { Close, Menu, Search } from "@mui/icons-material";
import {
  AppBar,
  Box,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { UserMenu } from "./user-menu";
import { NotificationMenu } from "./notification-menu";
import { Breadcrumbs } from "./breadcrumbs";
import { useGlobalSearch } from "../hooks/use-global-search";
import { useUiStore } from "../store/ui-store";
import { useDropdown } from "../hooks/use-dropdown";
import { useI18n } from "../hooks/use-i18n";
import { useBreadcrumbs } from "../hooks/use-breadcrumbs";

const headerIconSx = {
  width: 38,
  height: 38,
  borderRadius: "8px",
  border: "1px solid",
  borderColor: "divider",
  bgcolor: "background.paper",
  color: "text.secondary",
  "&:hover": {
    borderColor: "primary.main",
    color: "primary.main",
    bgcolor: (theme: { palette: { mode: string } }) =>
      theme.palette.mode === "dark" ? "rgba(77, 154, 91, 0.12)" : "rgba(35, 103, 58, 0.06)",
  },
} as const;

function HeaderSearchField({
  value,
  onChange,
  placeholder,
  autoFocus,
  onClose,
  inputRef,
  fullWidth,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  onClose?: () => void;
  inputRef?: RefObject<HTMLInputElement | null>;
  fullWidth?: boolean;
}) {
  return (
    <TextField
      inputRef={inputRef}
      fullWidth={fullWidth}
      size="small"
      value={value}
      autoFocus={autoFocus}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      sx={{
        width: fullWidth ? "100%" : 280,
        "& .MuiOutlinedInput-root": {
          borderRadius: "8px",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "rgba(255,255,255,0.04)" : "#F3F5F4",
          "& fieldset": { borderColor: "transparent" },
          "&:hover fieldset": { borderColor: "divider" },
          "&.Mui-focused": {
            bgcolor: "background.paper",
            "& fieldset": { borderColor: "primary.main" },
          },
        },
      }}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fontSize: 18, color: "text.secondary" }} />
            </InputAdornment>
          ),
          endAdornment: onClose ? (
            <InputAdornment position="end">
              <IconButton
                size="small"
                onClick={onClose}
                sx={{ borderRadius: "8px" }}
                aria-label="close search"
              >
                <Close fontSize="small" />
              </IconButton>
            </InputAdornment>
          ) : value ? (
            <InputAdornment position="end">
              <IconButton size="small" onClick={() => onChange("")} sx={{ borderRadius: "8px" }}>
                <Close sx={{ fontSize: 16 }} />
              </IconButton>
            </InputAdornment>
          ) : undefined,
        },
      }}
    />
  );
}

type HeaderProps = {
  homeTo?: string;
  searchPlaceholder?: string;
  notificationViewAllPath?: string;
};

export function Header({
  homeTo = "/",
  searchPlaceholder,
  notificationViewAllPath = "/notifications",
}: HeaderProps = {}) {
  const theme = useTheme();
  const isCompact = useMediaQuery(theme.breakpoints.down("md"));
  const userMenu = useDropdown();
  const notificationMenu = useDropdown();
  const { search, setSearch } = useGlobalSearch();
  const { sidebarOpen, setSidebarOpen } = useUiStore();
  const { t } = useI18n();
  const crumbs = useBreadcrumbs();
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const pageTitle = useMemo(() => {
    if (crumbs.length === 0) return t("common.home", "Home");
    return crumbs[crumbs.length - 1]?.label || t("common.home", "Home");
  }, [crumbs, t]);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  const placeholder = searchPlaceholder || t("search.placeholder");

  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={0}
      sx={{
        width: "100%",
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          minHeight: { xs: 64, md: 68 },
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
          sx={headerIconSx}
        >
          <Menu sx={{ fontSize: 20 }} />
        </IconButton>

        {searchOpen && isCompact ? (
          <HeaderSearchField
            value={search}
            onChange={setSearch}
            placeholder={placeholder}
            inputRef={searchInputRef}
            fullWidth
            onClose={() => {
              setSearchOpen(false);
              setSearch("");
            }}
          />
        ) : (
          <>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  fontSize: { xs: "0.95rem", md: "1.05rem" },
                  lineHeight: 1.25,
                  color: "text.primary",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {pageTitle}
              </Typography>
              <Box sx={{ display: { xs: "none", sm: "block" }, mt: 0.25 }}>
                <Breadcrumbs homeTo={homeTo} compact />
              </Box>
            </Box>

            {!isCompact ? (
              <Box sx={{ flexShrink: 0 }}>
                <HeaderSearchField
                  value={search}
                  onChange={setSearch}
                  placeholder={placeholder}
                />
              </Box>
            ) : (
              <IconButton
                size="small"
                onClick={() => setSearchOpen(true)}
                aria-label={placeholder}
                sx={headerIconSx}
              >
                <Search sx={{ fontSize: 20 }} />
              </IconButton>
            )}

            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "center",
                flexShrink: 0,
                pl: { md: 0.5 },
                borderInlineStart: { md: "1px solid" },
                borderColor: { md: "divider" },
                marginInlineStart: { md: 0.5 },
                paddingInlineStart: { md: 1.5 },
              }}
            >
              <NotificationMenu
                dropdown={notificationMenu}
                onOpen={userMenu.close}
                viewAllPath={notificationViewAllPath}
                buttonSx={headerIconSx}
              />
              <UserMenu dropdown={userMenu} onOpen={notificationMenu.close} />
            </Stack>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}
