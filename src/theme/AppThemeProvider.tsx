import { useMemo, type PropsWithChildren } from "react";
import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import rtlPlugin from "stylis-plugin-rtl/dist/stylis-rtl.js";
import { prefixer } from "stylis";
import { useUiStore } from "../store/ui-store";
import { createAppTheme } from "./mui-theme";
import { ColorModeProvider, useColorMode } from "./useColorMode";
import { SnackbarProvider } from "../components/ui/snackbar";

function createEmotionCache(direction: "ltr" | "rtl") {
  if (direction === "rtl") {
    return createCache({ key: "muirtl", stylisPlugins: [prefixer, rtlPlugin] });
  }
  return createCache({ key: "muiltr", stylisPlugins: [prefixer] });
}

function ThemedApp({ children }: PropsWithChildren) {
  const { mode } = useColorMode();
  const { direction } = useUiStore();
  const theme = useMemo(() => createAppTheme(mode, direction), [mode, direction]);
  const cache = useMemo(() => createEmotionCache(direction), [direction]);

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SnackbarProvider>{children}</SnackbarProvider>
      </ThemeProvider>
    </CacheProvider>
  );
}

export function AppThemeProvider({ children }: PropsWithChildren) {
  return (
    <ColorModeProvider>
      <ThemedApp>{children}</ThemedApp>
    </ColorModeProvider>
  );
}
