import type { PropsWithChildren, ReactNode } from "react";
import { DarkMode, LightMode } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from "@mui/material";
import { useUiStore } from "../../store/ui-store";
import { useI18n } from "../../hooks/use-i18n";
import { useColorMode } from "../../theme/useColorMode";

type AuthChromeProps = PropsWithChildren<{
  footer?: ReactNode;
}>;

export function AuthChrome({ children, footer }: AuthChromeProps) {
  const { direction, language, setLanguage } = useUiStore();
  const { mode, toggleColorMode } = useColorMode();
  const { t } = useI18n();

  return (
    <Box
      dir={direction}
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
        bgcolor: "background.default",
        backgroundImage: (theme) =>
          theme.palette.mode === "light"
            ? "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(35,103,58,0.12), transparent), radial-gradient(ellipse 60% 50% at 100% 100%, rgba(77,154,91,0.08), transparent)"
            : "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(77,154,91,0.15), transparent), radial-gradient(ellipse 60% 50% at 0% 100%, rgba(35,103,58,0.1), transparent)",
      }}
    >
      <Stack
        direction="row"
        spacing={1}
        sx={{
          position: "absolute",
          top: { xs: 12, sm: 20 },
          insetInlineEnd: { xs: 12, sm: 24 },
          zIndex: 2,
          alignItems: "center",
        }}
      >
        <ToggleButtonGroup
          size="small"
          exclusive
          value={language}
          onChange={(_, value: "ar" | "en" | null) => {
            if (value) setLanguage(value);
          }}
          aria-label={t("menu.language")}
        >
          <ToggleButton value="en">EN</ToggleButton>
          <ToggleButton value="ar">AR</ToggleButton>
        </ToggleButtonGroup>
        <Tooltip title={mode === "dark" ? t("menu.lightMode") : t("menu.darkMode")}>
          <IconButton onClick={toggleColorMode} aria-label={t("menu.direction")} size="small">
            {mode === "dark" ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Stack>

      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 3 },
          py: { xs: 8, sm: 4 },
        }}
      >
        {children}
      </Box>

      {footer ? (
        <Box sx={{ pb: 3, px: 2, textAlign: "center" }}>{footer}</Box>
      ) : null}
    </Box>
  );
}
