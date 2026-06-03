import { Bell } from "lucide-react";
import { Card } from "./ui/card";
import { useI18n } from "../hooks/use-i18n";

export function NotificationCenter() {
  const { t } = useI18n();
  const items = [
    { title: t("inbox.pendingApprovals.title"), detail: t("inbox.pendingApprovals.detail"), time: t("inbox.time.5m") },
    { title: t("inbox.orderAnomaly.title"), detail: t("inbox.orderAnomaly.detail"), time: t("inbox.time.21m") },
    { title: t("inbox.teamUpdate.title"), detail: t("inbox.teamUpdate.detail"), time: t("inbox.time.1h") },
  ];

  return (
    <Card className="min-w-0 w-full max-w-full">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-[#23673A]" />
          <h3 className="text-sm font-semibold text-(--app-text-primary)">{t("inbox.title")}</h3>
        </div>
        <span className="rounded-full bg-[#23673A]/10 px-2 py-1 text-xs font-semibold text-[#23673A]">3 {t("common.new")}</span>
      </div>
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-(--app-border) bg-(--app-surface) p-3 transition hover:-translate-y-0.5 hover:shadow-(--app-shadow-soft)"
          >
            <p className="text-sm font-semibold text-(--app-text-primary)">{item.title}</p>
            <p className="mt-1 text-xs text-(--app-text-secondary)">{item.detail}</p>
            <p className="mt-2 text-[11px] font-medium text-[#23673A]">{item.time}</p>
          </div>
        ))}
      </div>
    </Card>
  );
}
