import { NavigateNext } from "@mui/icons-material";
import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useBreadcrumbs } from "../hooks/use-breadcrumbs";
import { useI18n } from "../hooks/use-i18n";

type Props = {
  homeTo?: string;
  compact?: boolean;
};

export function Breadcrumbs({ homeTo = "/", compact = false }: Props) {
  const { t } = useI18n();
  const crumbs = useBreadcrumbs();

  return (
    <MuiBreadcrumbs
      aria-label="breadcrumb"
      separator={<NavigateNext sx={{ fontSize: 14, color: "text.disabled" }} />}
      sx={{
        fontSize: compact ? 12 : 13,
        lineHeight: 1.2,
        "& .MuiBreadcrumbs-ol": { flexWrap: "nowrap" },
        "& .MuiBreadcrumbs-li": {
          maxWidth: compact ? 140 : 180,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        },
      }}
    >
      <Link
        component={RouterLink}
        underline="hover"
        color="text.secondary"
        to={homeTo}
        sx={{ fontWeight: 500, "&:hover": { color: "primary.main" } }}
      >
        {t("common.home")}
      </Link>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return isLast ? (
          <Typography
            key={crumb.href}
            color="text.secondary"
            sx={{ fontSize: "inherit", fontWeight: 600 }}
          >
            {crumb.label}
          </Typography>
        ) : (
          <Link
            key={crumb.href}
            component={RouterLink}
            underline="hover"
            color="text.secondary"
            to={crumb.href}
            sx={{ fontWeight: 500, "&:hover": { color: "primary.main" } }}
          >
            {crumb.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}
