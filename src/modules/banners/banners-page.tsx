import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Megaphone, Plus, Trash2 } from "lucide-react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { AppBadge, AppTable, AppTableCell, AppTableHead, AppTableHeaderCell, AppTableRow } from "../../components/design-system";
import { deleteAdminBannerApi, fetchAdminBanners, type AdminBanner } from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import { getApiErrorMessage } from "../../utils/api-error";
import { BannerFormDrawer } from "./banner-form-drawer";
import { toast } from "../../components/ui/sonner";
import { useI18n } from "../../hooks/use-i18n";

export function BannersPage() {
  const { t } = useI18n();
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-banners"],
    queryFn: fetchAdminBanners,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAdminBannerApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-banners"] });
      toast.success(t("banners.deleted"));
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, t("banners.deleteFailed"))),
  });

  const banners = useMemo(() => (data || []) as AdminBanner[], [data]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin-banners"] });

  return (
    <div className="min-w-0 space-y-4 overflow-x-hidden">
      <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-[#23673A]/12 text-[#23673A]">
            <Megaphone className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-(--app-text-primary)">{t("banners.title")}</h2>
            <p className="text-sm text-(--app-text-secondary)">{t("banners.subtitle")}</p>
          </div>
        </div>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="me-2 size-4" />
          {t("banners.addButton")}
        </Button>
      </Card>

      {isLoading ? <Card className="p-6">{t("common.loading")}</Card> : null}
      {isError ? (
        <Card className="p-6 text-red-600">
          {t("banners.loadFailed")}: {getApiErrorMessage(error)}
        </Card>
      ) : null}

      {!isLoading && !isError && !banners.length ? (
        <Card className="flex flex-col items-center gap-4 p-10 text-center">
          <Megaphone className="size-10 text-(--app-text-secondary)" />
          <p className="text-sm text-(--app-text-secondary)">{t("banners.empty")}</p>
          <Button onClick={() => setFormOpen(true)}>
            <Plus className="me-2 size-4" />
            {t("banners.addButton")}
          </Button>
        </Card>
      ) : null}

      {!isLoading && !isError && banners.length > 0 ? (
        <AppTable title={t("banners.listTitle")}>
          <AppTableHead>
            <tr>
              <AppTableHeaderCell>{t("banners.colImage")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("banners.colTitle")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("banners.colLinkType")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("banners.colSortOrder")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("banners.colStatus")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("banners.colActions")}</AppTableHeaderCell>
            </tr>
          </AppTableHead>
          <tbody>
            {banners.map((banner) => (
              <AppTableRow key={banner.id}>
                <AppTableCell>
                  {banner.imagePath ? (
                    <img
                      src={resolveAssetUrl(banner.imagePath)}
                      alt={banner.title}
                      className="h-14 w-24 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-14 w-24 rounded-lg bg-(--app-surface-muted)" />
                  )}
                </AppTableCell>
                <AppTableCell className="font-medium">{banner.title}</AppTableCell>
                <AppTableCell>{banner.linkType || "—"}</AppTableCell>
                <AppTableCell>{banner.sortOrder ?? 0}</AppTableCell>
                <AppTableCell>
                  <AppBadge variant={banner.isActive ? "success" : "neutral"}>
                    {banner.isActive ? t("banners.active") : t("banners.inactive")}
                  </AppBadge>
                </AppTableCell>
                <AppTableCell>
                  <Button
                    variant="ghost"
                    className="text-red-600"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(t("banners.confirmDelete"))) {
                        deleteMutation.mutate(banner.id);
                      }
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </AppTableCell>
              </AppTableRow>
            ))}
          </tbody>
        </AppTable>
      ) : null}

      <BannerFormDrawer open={formOpen} onClose={() => setFormOpen(false)} onSuccess={invalidate} />
    </div>
  );
}
