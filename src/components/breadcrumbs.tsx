import { Breadcrumbs as MuiBreadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useBreadcrumbs } from "../hooks/use-breadcrumbs";
import { useI18n } from "../hooks/use-i18n";

export function Breadcrumbs() {
  const { t } = useI18n();
  const crumbs = useBreadcrumbs();

  return (
    <MuiBreadcrumbs aria-label="breadcrumb" sx={{ fontSize: 13 }}>
      <Link component={RouterLink} underline="hover" color="inherit" to="/">
        {t("common.home")}
      </Link>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        return isLast ? (
          <Typography key={crumb.href} color="text.primary" sx={{ fontSize: "inherit" }}>
            {crumb.label}
          </Typography>
        ) : (
          <Link key={crumb.href} component={RouterLink} underline="hover" color="inherit" to={crumb.href}>
            {crumb.label}
          </Link>
        );
      })}
    </MuiBreadcrumbs>
  );
}
