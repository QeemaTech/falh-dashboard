import type { ReactNode } from "react";
import { ArrowBack } from "@mui/icons-material";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../hooks/use-i18n";

type FormPageShellProps = {
  title: string;
  subtitle?: string;
  backTo?: string;
  onBack?: () => void;
  actions?: ReactNode;
  maxWidth?: number | string;
  plain?: boolean;
  children: ReactNode;
};

export function FormPageShell({
  title,
  subtitle,
  backTo,
  onBack,
  actions,
  maxWidth = "100%",
  plain = false,
  children,
}: FormPageShellProps) {
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
    <Stack spacing={2.5} sx={{ width: "100%", maxWidth: maxWidth || "100%", mx: "auto" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ justifyContent: "space-between", alignItems: { sm: "flex-start" } }}
      >
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", minWidth: 0 }}>
          <Button
            variant="outlined"
            color="inherit"
            size="small"
            onClick={handleBack}
            startIcon={<ArrowBack fontSize="small" />}
            sx={{ borderRadius: "8px", flexShrink: 0, mt: 0.25 }}
          >
            {t("common.back", "Back")}
          </Button>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" sx={{ fontWeight: 700, fontSize: "1.25rem" }}>
              {title}
            </Typography>
            {subtitle ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                {subtitle}
              </Typography>
            ) : null}
          </Box>
        </Stack>
        {actions ? <Box sx={{ flexShrink: 0 }}>{actions}</Box> : null}
      </Stack>

      {plain ? (
        children
      ) : (
        <Paper
          variant="outlined"
          sx={{
            borderRadius: "8px",
            borderColor: "divider",
            p: { xs: 2, md: 3 },
          }}
        >
          {children}
        </Paper>
      )}
    </Stack>
  );
}
