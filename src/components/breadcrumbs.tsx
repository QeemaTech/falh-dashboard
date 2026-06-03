import { Link } from "react-router-dom";
import { useBreadcrumbs } from "../hooks/use-breadcrumbs";
import { useI18n } from "../hooks/use-i18n";

export function Breadcrumbs() {
  const { t } = useI18n();
  const crumbs = useBreadcrumbs();
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-neutral-500 dark:text-neutral-400">
      <Link to="/" className="transition hover:text-[#23673A]">
        {t("common.home")}
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-2">
          <span className="text-neutral-300 dark:text-neutral-600">/</span>
          <Link to={crumb.href} className="capitalize transition hover:text-[#23673A]">
            {crumb.label}
          </Link>
        </span>
      ))}
    </div>
  );
}
