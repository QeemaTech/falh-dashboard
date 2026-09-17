import type { ReactNode } from "react";
import { ArrowBack } from "@mui/icons-material";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../hooks/use-i18n";

const BRAND_GREEN = "#23673A";

type DetailSection = {
  title?: string;
  content: ReactNode;
};

type DetailPageShellProps = {
  title: string;
  subtitle?: string;
  status?: ReactNode;
  backTo?: string;
  onBack?: () => void;
  actions?: ReactNode;
  headerExtra?: ReactNode;
  sections?: DetailSection[];
  children?: ReactNode;
};

export function DetailPageShell({
  title,
  subtitle,
  status,
  backTo,
  onBack,
  actions,
  headerExtra,
  sections,
  children,
}: DetailPageShellProps) {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (backTo) {
      navigate(backTo);
      return;
    }
    navigate(-1);
  };

  return (
    <Stack spacing={3} sx={{ width: "100%" }}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: "8px",
          borderColor: "divider",
          overflow: "hidden",
          borderTop: `3px solid ${BRAND_GREEN}`,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            bgcolor: BRAND_GREEN,
          },
        }}
      >
        <Box
          sx={{
            pl: { xs: 2, md: 2.75 },
            pr: { xs: 2, md: 2.5 },
            py: { xs: 2, md: 2.5 },
            background: `linear-gradient(90deg, ${BRAND_GREEN}0A 0%, transparent 48%)`,
          }}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between", alignItems: { md: "flex-start" } }}
          >
            <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", minWidth: 0, flex: 1 }}>
              <Button
                variant="outlined"
                color="inherit"
                size="small"
                onClick={handleBack}
                startIcon={<ArrowBack fontSize="small" />}
                sx={{ borderRadius: "8px", flexShrink: 0 }}
              >
                {t("common.back", "Back")}
              </Button>
              <Box sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.5 }}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, fontSize: "1.25rem", letterSpacing: "-0.01em", lineHeight: 1.3 }}
                  >
                    {title}
                  </Typography>
                  {status}
                </Stack>
                {subtitle ? (
                  <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.5 }}>
                    {subtitle}
                  </Typography>
                ) : null}
                {headerExtra ? <Box sx={{ mt: 1.75 }}>{headerExtra}</Box> : null}
              </Box>
            </Stack>
            {actions ? (
              <Stack
                direction="row"
                spacing={1}
                sx={{
                  flexShrink: 0,
                  flexWrap: "wrap",
                  "& .MuiButton-root": { borderRadius: "8px" },
                }}
              >
                {actions}
              </Stack>
            ) : null}
          </Stack>
        </Box>
      </Paper>

      {sections?.map((section, index) => (
        <Paper
          key={section.title ?? index}
          variant="outlined"
          sx={{ borderRadius: "8px", borderColor: "divider", overflow: "hidden" }}
        >
          {section.title ? (
            <Box
              sx={{
                px: { xs: 2, md: 2.5 },
                py: 1.5,
                borderBottom: 1,
                borderColor: "divider",
                bgcolor: "action.hover",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: 0.8,
                  color: "text.secondary",
                  fontSize: "0.7rem",
                }}
              >
                {section.title}
              </Typography>
            </Box>
          ) : null}
          <Box sx={{ p: { xs: 2, md: 2.5 } }}>{section.content}</Box>
        </Paper>
      ))}

      {children}
    </Stack>
  );
}

type DetailFieldProps = {
  label: string;
  value?: ReactNode;
};

export function DetailField({ label, value }: DetailFieldProps) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: "8px",
        px: 1.5,
        py: 1.25,
        height: "100%",
        minHeight: 64,
        bgcolor: "background.paper",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          display: "block",
          mb: 0.5,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: 0.6,
          fontSize: "0.65rem",
        }}
      >
        {label}
      </Typography>
      {typeof value === "string" || typeof value === "number" || value == null ? (
        <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: "break-word", lineHeight: 1.5 }}>
          {value ?? "—"}
        </Typography>
      ) : (
        <Box sx={{ fontWeight: 500, wordBreak: "break-word", lineHeight: 1.5, fontSize: "0.875rem" }}>
          {value}
        </Box>
      )}
    </Box>
  );
}

type DetailGridProps = {
  children: ReactNode;
  columns?: { xs?: number; sm?: number; md?: number };
};

export function DetailGrid({ children, columns = { xs: 1, sm: 2, md: 3 } }: DetailGridProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: {
          xs: `repeat(${columns.xs ?? 1}, minmax(0, 1fr))`,
          sm: `repeat(${columns.sm ?? 2}, minmax(0, 1fr))`,
          md: `repeat(${columns.md ?? 3}, minmax(0, 1fr))`,
        },
      }}
    >
      {children}
    </Box>
  );
}
