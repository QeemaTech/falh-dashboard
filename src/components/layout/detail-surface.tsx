import type { ReactNode } from "react";
import { ArrowBack } from "@mui/icons-material";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { useI18n } from "../../hooks/use-i18n";

export const DETAIL_BRAND = "#23673A";

export function DetailBackButton({ to }: { to?: string }) {
  const navigate = useNavigate();
  const { t } = useI18n();
  return (
    <Button
      variant="text"
      color="inherit"
      size="small"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      startIcon={<ArrowBack fontSize="small" />}
      sx={{ borderRadius: "8px", alignSelf: "flex-start", color: "text.secondary", px: 0.5 }}
    >
      {t("common.back", "Back")}
    </Button>
  );
}

export function DetailHero({
  media,
  title,
  status,
  meta,
  actions,
}: {
  media: ReactNode;
  title: ReactNode;
  status?: ReactNode;
  meta?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: "8px",
        borderColor: "divider",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <Box
        sx={{
          height: { xs: 72, md: 96 },
          background: (theme) =>
            theme.palette.mode === "dark"
              ? `linear-gradient(125deg, ${DETAIL_BRAND} 0%, #163d24 55%, #0f1f14 100%)`
              : `linear-gradient(125deg, ${DETAIL_BRAND} 0%, #2f8a4d 48%, #4D9A5B 100%)`,
          position: "relative",
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 88% 18%, rgba(255,255,255,0.2), transparent 42%)",
          },
        }}
      />
      <Box sx={{ px: { xs: 2, md: 3 }, pb: { xs: 2.25, md: 2.75 }, mt: { xs: -4, md: -5 } }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "stretch", md: "flex-end" }, justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={2} sx={{ alignItems: "flex-end", minWidth: 0, flex: 1 }}>
            <Box sx={{ flexShrink: 0 }}>{media}</Box>
            <Box sx={{ minWidth: 0, pb: 0.25, flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                sx={{ alignItems: "center", flexWrap: "wrap", mb: 0.75, rowGap: 0.75 }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: "1.15rem", md: "1.4rem" },
                    letterSpacing: "-0.02em",
                    lineHeight: 1.25,
                    wordBreak: "break-word",
                  }}
                >
                  {title}
                </Typography>
                {status}
              </Stack>
              {meta}
            </Box>
          </Stack>
          {actions ? (
            <Stack direction="row" spacing={1} useFlexGap sx={{ flexShrink: 0, flexWrap: "wrap" }}>
              {actions}
            </Stack>
          ) : null}
        </Stack>
      </Box>
    </Paper>
  );
}

export function DetailMediaFrame({
  children,
  size = { xs: 72, md: 88 },
}: {
  children: ReactNode;
  size?: { xs: number; md: number };
}) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: "8px",
        border: "3px solid",
        borderColor: "background.paper",
        bgcolor: "background.paper",
        color: "primary.main",
        display: "grid",
        placeItems: "center",
        boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
        overflow: "hidden",
        fontWeight: 800,
        fontSize: { xs: "1.25rem", md: "1.5rem" },
        letterSpacing: 0.4,
      }}
    >
      {children}
    </Box>
  );
}

export function MetricTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: "8px",
        borderColor: "divider",
        height: "100%",
        background: (theme) =>
          theme.palette.mode === "dark"
            ? "linear-gradient(160deg, rgba(77,154,91,0.08), transparent 55%)"
            : "linear-gradient(160deg, rgba(35,103,58,0.05), #fff 50%)",
      }}
    >
      <Stack direction="row" spacing={1.25} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
            {label}
          </Typography>
          <Typography variant="h6" sx={{ mt: 0.75, fontWeight: 700, lineHeight: 1.25, wordBreak: "break-word" }}>
            {value}
          </Typography>
        </Box>
        {icon ? (
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "8px",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
              bgcolor: (theme) =>
                theme.palette.mode === "dark" ? "rgba(77,154,91,0.16)" : "rgba(35,103,58,0.1)",
              color: "primary.main",
            }}
          >
            {icon}
          </Box>
        ) : null}
      </Stack>
    </Paper>
  );
}

export function MetricsRow({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, 1fr)",
          lg: "repeat(4, 1fr)",
        },
      }}
    >
      {children}
    </Box>
  );
}

export function InfoRow({ label, value }: { label: string; value?: ReactNode }) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", sm: "150px 1fr" },
        gap: { xs: 0.35, sm: 2 },
        py: 1.25,
        borderBottom: 1,
        borderColor: "divider",
        "&:last-of-type": { borderBottom: 0 },
      }}
    >
      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography component="div" variant="body2" sx={{ fontWeight: 500, wordBreak: "break-word" }}>
        {value ?? "—"}
      </Typography>
    </Box>
  );
}

export function SectionCard({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: "8px", borderColor: "divider", overflow: "hidden" }}>
      <Stack
        direction="row"
        sx={{
          px: { xs: 2, md: 2.5 },
          py: 1.5,
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: (theme) =>
            theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(35,103,58,0.03)",
        }}
      >
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
          {title}
        </Typography>
        {action}
      </Stack>
      <Box sx={{ p: { xs: 2, md: 2.5 } }}>{children}</Box>
    </Paper>
  );
}

export function DetailTwoColumn({
  main,
  side,
}: {
  main: ReactNode;
  side?: ReactNode;
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: { xs: "1fr", lg: side ? "1.45fr 1fr" : "1fr" },
        alignItems: "start",
      }}
    >
      <Stack spacing={2}>{main}</Stack>
      {side ? <Stack spacing={2}>{side}</Stack> : null}
    </Box>
  );
}

export function MetaItem({ icon, children }: { icon?: ReactNode; children: ReactNode }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", color: "text.secondary", minWidth: 0 }}>
      {icon}
      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
        {children}
      </Typography>
    </Stack>
  );
}
