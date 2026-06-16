import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Visibility } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Link,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { AppDrawer } from "../../components/design-system";
import { DataTable, EmptyState, PageHeader } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  fetchAdminServiceProviders,
  fetchJoinApplicationTypes,
  fetchServiceProviderById,
  type AdminServiceProvider,
  type JoinApplicationType,
} from "../../services/admin-api";

const TAB_ALL = "ALL" as const;
type ConsultantTab = typeof TAB_ALL | string;

type ConsultantRow = {
  id: string;
  name: string;
  typeKey: string;
  city: string;
  status: string;
  rating: string;
};

function providerName(provider: AdminServiceProvider) {
  return provider.name || provider.displayName || provider.user?.name || "-";
}

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED" || status === "SUSPENDED") return "error";
  return "default";
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <Typography variant="body2">
      <Box component="span" sx={{ fontWeight: 600 }}>
        {label}:
      </Box>{" "}
      {value}
    </Typography>
  );
}

export function ConsultantsPage() {
  const { t, language } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<ConsultantTab>(TAB_ALL);

  const { data: joinTypes = [] } = useQuery({
    queryKey: ["join-application-types"],
    queryFn: fetchJoinApplicationTypes,
  });

  const typesByCode = useMemo(() => {
    const map = new Map<string, JoinApplicationType>();
    joinTypes.forEach((type) => map.set(type.code, type));
    return map;
  }, [joinTypes]);

  const resolveTypeKey = (provider: AdminServiceProvider) =>
    provider.applicationType || provider.type;

  const typeLabel = (typeKey: string, otherTypeLabel?: string | null) => {
    const row = typesByCode.get(typeKey);
    if (row) {
      return language === "ar" ? row.nameAr || row.nameEn : row.nameEn || row.nameAr;
    }
    if (typeKey === "OTHER" && otherTypeLabel) return otherTypeLabel;
    return t(`consultants.type.${typeKey}`, typeKey);
  };

  const tabItems = useMemo(() => {
    const active = joinTypes.filter((type) => type.isActive && type.category === "PROVIDER");
    return [
      { code: TAB_ALL, label: t("joinUs.tab.all") },
      ...active.map((type) => ({
        code: type.code,
        label: language === "ar" ? type.nameAr || type.nameEn : type.nameEn || type.nameAr,
      })),
    ];
  }, [joinTypes, language, t]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-consultants", tab],
    queryFn: () =>
      fetchAdminServiceProviders({
        page: 1,
        limit: 100,
        sortBy: "createdAt",
        sortOrder: "desc",
        applicationType: tab === TAB_ALL ? undefined : tab,
      }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["admin-consultant", selectedId],
    queryFn: () => fetchServiceProviderById(selectedId!),
    enabled: Boolean(selectedId),
  });

  const statusLabel = (status: string) => t(`consultants.status.${status}`, status);

  const rows = useMemo<ConsultantRow[]>(() => {
    const items = (data?.items || []) as AdminServiceProvider[];
    return items.map((provider) => ({
      id: provider.id,
      name: providerName(provider),
      typeKey: resolveTypeKey(provider),
      city: provider.city || "-",
      status: provider.status,
      rating: Number(provider.rating || 0).toFixed(1),
    }));
  }, [data?.items]);

  if (isError) {
    return (
      <EmptyState
        title={t("consultants.loadFailed")}
        description={(error as Error).message}
      />
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader title={t("consultants.title")} subtitle={t("consultants.subtitle")} />

      <Paper sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 0.75 }}>
          {tabItems.map((item) => (
            <Chip
              key={item.code}
              label={item.label}
              clickable
              color={tab === item.code ? "primary" : "default"}
              variant={tab === item.code ? "filled" : "outlined"}
              onClick={() => setTab(item.code)}
              size="small"
            />
          ))}
        </Stack>
      </Paper>

      <DataTable<ConsultantRow>
        title={t("consultants.listTitle")}
        loading={isLoading}
        loadingMessage={t("common.loading")}
        emptyMessage={t("consultants.empty")}
        getRowKey={(row) => row.id}
        columns={[
          {
            key: "name",
            label: t("consultants.col.name"),
            render: (row) => (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {row.name}
              </Typography>
            ),
          },
          {
            key: "type",
            label: t("consultants.col.type"),
            render: (row) => typeLabel(row.typeKey),
          },
          { key: "city", label: t("consultants.col.city") },
          {
            key: "status",
            label: t("consultants.col.status"),
            render: (row) => (
              <Chip label={statusLabel(row.status)} color={statusChipColor(row.status)} size="small" />
            ),
          },
          { key: "rating", label: t("consultants.col.rating") },
          {
            key: "id",
            label: t("consultants.col.actions"),
            render: (row) => (
              <Button
                size="small"
                startIcon={<Visibility fontSize="small" />}
                onClick={() => setSelectedId(row.id)}
              >
                {t("consultants.view")}
              </Button>
            ),
          },
        ]}
        data={rows}
      />

      <AppDrawer
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title={t("consultants.detailsTitle")}
      >
        {detailLoading ? (
          <Stack sx={{ py: 2, alignItems: "center" }}>
            <CircularProgress size={24} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t("common.loading")}
            </Typography>
          </Stack>
        ) : null}

        {detail ? (
          <Stack spacing={2}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {providerName(detail)}
            </Typography>
            <Chip
              label={statusLabel(detail.status)}
              color={statusChipColor(detail.status)}
              size="small"
              sx={{ alignSelf: "flex-start" }}
            />
            <DetailRow
              label={t("consultants.col.type")}
              value={typeLabel(resolveTypeKey(detail), detail.otherTypeLabel)}
            />
            <DetailRow label={t("consultants.col.city")} value={detail.city} />
            <DetailRow label={t("consultants.col.rating")} value={Number(detail.rating || 0).toFixed(1)} />
            <DetailRow label={t("consultants.phone")} value={detail.contactNumber || undefined} />
            {detail.whatsappNumber ? (
              <Typography variant="body2">
                <Box component="span" sx={{ fontWeight: 600 }}>
                  {t("consultants.whatsapp")}:
                </Box>{" "}
                {detail.whatsappLink ? (
                  <Link href={detail.whatsappLink} target="_blank" rel="noreferrer">
                    {detail.whatsappNumber}
                  </Link>
                ) : (
                  detail.whatsappNumber
                )}
              </Typography>
            ) : null}
            <DetailRow label={t("consultants.bio")} value={detail.bio || undefined} />
            {detail.yearsOfExperience != null ? (
              <DetailRow
                label={t("consultants.experience")}
                value={`${detail.yearsOfExperience} ${t("consultants.years")}`}
              />
            ) : null}
            {detail.specializations?.length ? (
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                  {t("consultants.specializations")}
                </Typography>
                <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                  {detail.specializations.map((item) => (
                    <Chip key={item} label={item} size="small" variant="outlined" />
                  ))}
                </Stack>
              </Box>
            ) : null}
          </Stack>
        ) : null}
      </AppDrawer>
    </Stack>
  );
}
