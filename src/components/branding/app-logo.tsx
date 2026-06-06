import { Box, Typography } from "@mui/material";
import { useColorMode } from "../../theme/useColorMode";
import { useI18n } from "../../hooks/use-i18n";

export const LOGO_SRC = "/logo.png";

type AppLogoProps = {
  size?: number;
  showLabel?: boolean;
  label?: string;
};

export function AppLogo({ size = 48, showLabel = false, label }: AppLogoProps) {
  const { mode } = useColorMode();
  const { t } = useI18n();

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 1.5,
        maxWidth: "100%",
      }}
    >
      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          px: mode === "dark" ? 1 : 0,
          py: mode === "dark" ? 0.5 : 0,
          borderRadius: 2,
          bgcolor: mode === "dark" ? "rgba(255,255,255,0.96)" : "transparent",
          flexShrink: 0,
        }}
      >
        <Box
          component="img"
          src={LOGO_SRC}
          alt={t("brand.name")}
          sx={{
            height: size,
            width: "auto",
            maxWidth: size * 3,
            objectFit: "contain",
            display: "block",
          }}
        />
      </Box>
      {showLabel ? (
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
            {label || t("brand.name")}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {t("brand.tagline")}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
