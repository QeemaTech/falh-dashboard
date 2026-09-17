import type { ReactNode } from "react";
import { ArrowBack } from "@mui/icons-material";
import { Box, Button, Divider, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../hooks/use-i18n";

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
    <Stack spacing={2.5} sx={{ width: "100%" }}>
      <Paper
        variant="outlined"
        sx={{
          borderRadius: "8px",
          borderColor: "divider",
          p: { xs: 2, md: 2.5 },
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
                <Typography variant="h5" sx={{ fontWeight: 700, fontSize: "1.25rem" }}>
                  {title}
                </Typography>
                {status}
              </Stack>
              {subtitle ? (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              ) : null}
              {headerExtra ? <Box sx={{ mt: 1.5 }}>{headerExtra}</Box> : null}
            </Box>
          </Stack>
          {actions ? (
            <Stack direction="row" spacing={1} sx={{ flexShrink: 0, flexWrap: "wrap" }}>
              {actions}
            </Stack>
          ) : null}
        </Stack>
      </Paper>

      {sections?.map((section, index) => (
        <Paper
          key={section.title ?? index}
          variant="outlined"
          sx={{ borderRadius: "8px", borderColor: "divider", overflow: "hidden" }}
        >
          {section.title ? (
            <>
              <Box sx={{ px: 2.5, py: 1.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {section.title}
                </Typography>
              </Box>
              <Divider />
            </>
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
    <Box>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "block", mb: 0.35, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.4 }}
      >
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, wordBreak: "break-word" }}>
        {value ?? "—"}
      </Typography>
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
        gap: 2.5,
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
