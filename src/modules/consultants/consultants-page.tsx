import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Chip, Paper, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  DataTable,
  EmptyState,
  PageHeader,
  TablePaginationBar,
  TableRowActions,
  resolveTotalPages,
} from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { fetchAdminServiceProviders, type AdminServiceProvider } from "../../services/admin-api";
import { fetchProviderFilterTypes } from "../../services/provider-forms-api";
import { buildTypeFilterOptions, filterOptionLabel } from "../provider-forms/form-logic";

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

export function ConsultantsPage() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [tab, setTab] = useState<ConsultantTab>(TAB_ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [tab, pageSize]);

  // One backend source for every provider-type filter; archived/inactive types stay while they have providers.
  const { data: filterTypes = [] } = useQuery({
    queryKey: ["provider-filter-types"],
    queryFn: fetchProviderFilterTypes,
  });
  const options = useMemo(() => buildTypeFilterOptions(filterTypes, language), [filterTypes, language]);

  // The referential type is authoritative; the legacy `type` enum is only a last-resort label.
  const resolveTypeKey = (provider: AdminServiceProvider) =>
    provider.providerType?.code || provider.applicationType || provider.type;

  const typeLabel = (typeKey: string) => {
    const option = options.find((o) => o.code === typeKey);
    return option ? option.label : t(`consultants.type.${typeKey}`, typeKey);
  };

  const tabItems = useMemo(
    () => [
      { code: TAB_ALL as string, label: t("joinUs.tab.all") },
      ...options.map((option) => ({
        code: option.code,
        label: filterOptionLabel(option, { archived: t("joinUs.suffix.archived"), inactive: t("joinUs.suffix.inactive") }),
      })),
    ],
    [options, t]
  );

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["admin-consultants", tab, page, pageSize],
    queryFn: () =>
      fetchAdminServiceProviders({
        page,
        limit: pageSize,
        sortBy: "createdAt",
        sortOrder: "desc",
        applicationType: tab === TAB_ALL ? undefined : tab,
      }),
    placeholderData: (previousData) => previousData,
  });

  const statusLabel = (status: string) => t(`consultants.status.${status}`, status);

  const rows = useMemo<ConsultantRow[]>(() => {
    return (data?.items || []).map((provider) => ({
      id: provider.id,
      name: providerName(provider),
      typeKey: resolveTypeKey(provider),
      city: provider.city || "-",
      status: provider.status,
      rating: provider.rating != null ? String(provider.rating) : "-",
    }));
  }, [data?.items]);

  const totalPages = resolveTotalPages(data?.meta);

  if (isError) {
    return <EmptyState title={t("consultants.loadFailed")} description={(error as Error).message} />;
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader title={t("consultants.title")} subtitle={t("consultants.subtitle")} />

      <Paper variant="outlined" sx={{ p: 1, borderRadius: "8px", borderColor: "divider" }}>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
          {tabItems.map((item) => (
            <Chip
              key={item.code}
              label={item.label}
              color={tab === item.code ? "primary" : "default"}
              variant={tab === item.code ? "filled" : "outlined"}
              onClick={() => setTab(item.code)}
              sx={{ borderRadius: "8px" }}
            />
          ))}
        </Stack>
      </Paper>

      <DataTable<ConsultantRow>
        loading={isLoading}
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
            key: "typeKey",
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
              <TableRowActions
                onView={() => navigate(`/consultants/${row.id}`)}
                onEdit={() => navigate(`/consultants/${row.id}`)}
              />
            ),
          },
        ]}
        data={rows}
      />

      {rows.length > 0 || totalPages > 1 ? (
        <TablePaginationBar
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          isFetching={isFetching}
          totalItems={data?.meta?.total}
        />
      ) : null}
    </Stack>
  );
}
