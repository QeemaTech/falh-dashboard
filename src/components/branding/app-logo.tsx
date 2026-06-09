import { Box, Typography } from "@mui/material";
import { useColorMode } from "../../theme/useColorMode";
import { useBranding } from "../../hooks/use-branding";

export const LOGO_SRC = "/logo.png";

type AppLogoProps = {
  size?: number;
  showLabel?: boolean;
  label?: string;
  tagline?: string;
};

export function AppLogo({ size = 48, showLabel = false, label, tagline }: AppLogoProps) {
  const { mode } = useColorMode();
  const { projectName, footerText, logoUrl } = useBranding();
  const displayName = label || projectName;
  const displayTagline = tagline || footerText;

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
          src={logoUrl || LOGO_SRC}
          alt={displayName}
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
            {displayName}
          </Typography>
          {displayTagline ? (
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {displayTagline}
            </Typography>
          ) : null}
        </Box>
      ) : null}
    </Box>
  );
}
