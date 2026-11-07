import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Settings } from "@mui/icons-material";
import {
  Button,
  Chip,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { DataTable, EmptyState, FilterBar, PageHeader, TablePaginationBar, TableRowActions, resolveTotalPages } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { fetchJoinUsApplications, type JoinUsApplicationListItem, type JoinUsTab } from "../../services/admin-api";
import { fetchApplicationFilterTypes } from "../../services/provider-forms-api";
import { PermissionGate } from "../../components/permission-gate";
import { usePermission } from "../../store/permission-context";
import { buildTypeFilterOptions, filterOptionLabel } from "../provider-forms/form-logic";

const TAB_ALL = "ALL" as const;
const TAB_COMPANY = "COMPANY" as const;

type JoinRequestRow = JoinUsApplicationListItem & Record<string, unknown>;

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  return "error";
}

export function JoinRequestsPage() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [tab, setTab] = useState<JoinUsTab>(TAB_ALL);
  const { hasPermission } = usePermission();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [search, status, tab, pageSize]);

  // Provider filters come from the backend (active types + any type that has applications, archived included).
  // COMPANY is a separate fixed tab and is never mixed into the provider type filters.
  const { data: filterTypes = [] } = useQuery({
    queryKey: ["application-filter-types"],
    queryFn: fetchApplicationFilterTypes,
  });
  const providerOptions = useMemo(() => buildTypeFilterOptions(filterTypes, language), [filterTypes, language]);

  const typeLabel = (type: string) => {
    if (type === TAB_COMPANY) return t("joinUs.type.COMPANY");
    const option = providerOptions.find((o) => o.code === type);
    return option ? option.label : type;
  };

  const tabItems = useMemo(
    () => [
      { code: TAB_ALL as string, label: t("joinUs.tab.all") },
      ...(hasPermission("companies.view") ? [{ code: TAB_COMPANY as string, label: t("joinUs.tab.company") }] : []),
      ...providerOptions.map((option) => ({
        code: option.code,
        label: filterOptionLabel(option, { archived: t("joinUs.suffix.archived"), inactive: t("joinUs.suffix.inactive") }),
      })),
    ],
    [providerOptions, hasPermission, t]
  );

  const statusLabel = (value: string) =>
    t(`joinUs.status.${value}` as "joinUs.status.PENDING") || value;

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["join-us-applications", search, status, tab, page, pageSize],
    queryFn: () =>
      fetchJoinUsApplications({
        page,
        limit: pageSize,
        search: search || undefined,
        status: status || undefined,
        tab,
        applicationType: tab === TAB_ALL ? undefined : tab,
      }),
    placeholderData: (previousData) => previousData,
  });

  const applications = (data?.items || []) as JoinRequestRow[];
  const totalPages = resolveTotalPages(data?.meta);

  if (isError) {
    return <EmptyState title={t("joinUs.loadFailed")} description={(error as Error).message} />;
  }

  return (
    <Stack spacing={3} sx={{ minWidth: 0, overflowX: "hidden" }}>
      <PageHeader
        title={t("joinUs.title")}
        subtitle={t("joinUs.subtitle")}
        action={
          <PermissionGate permission={["provider_types.view", "provider_forms.view"]}>
            <Button variant="outlined" startIcon={<Settings />} onClick={() => navigate("/provider-types")}>
              {t("joinUs.manageProviderTypes")}
            </Button>
          </PermissionGate>
        }
      />

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

      <FilterBar>
        <TextField
          size="small"
          placeholder={t("joinUs.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 288 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          label={t("joinUs.filterStatus")}
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="">{t("joinUs.allStatuses")}</MenuItem>
          <MenuItem value="PENDING">{t("joinUs.status.PENDING")}</MenuItem>
          <MenuItem value="APPROVED">{t("joinUs.status.APPROVED")}</MenuItem>
          <MenuItem value="REJECTED">{t("joinUs.status.REJECTED")}</MenuItem>
        </TextField>
      </FilterBar>

      <DataTable<JoinRequestRow>
        loading={isLoading}
        emptyMessage={t("joinUs.empty")}
        getRowKey={(row) => row.id}
        columns={[
          {
            key: "applicantName",
            label: t("joinUs.col.applicant"),
            render: (row) => (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {row.applicantName}
              </Typography>
            ),
          },
          {
            key: "applicationType",
            label: t("joinUs.col.type"),
            render: (row) => typeLabel(row.applicationType),
          },
          { key: "phone", label: t("joinUs.col.phone") },
          { key: "city", label: t("joinUs.col.city") },
          {
            key: "status",
            label: t("joinUs.col.status"),
            render: (row) => (
              <Chip label={statusLabel(row.status)} color={statusChipColor(row.status)} size="small" />
            ),
          },
          {
            key: "createdAt",
            label: t("joinUs.col.created"),
            render: (row) => new Date(row.createdAt).toLocaleString(locale),
          },
          {
            key: "id",
            label: t("joinUs.col.actions"),
            render: (row) => (
              <TableRowActions
                onView={() => navigate(`/join-requests/${row.id}`)}
                onEdit={() => navigate(`/join-requests/${row.id}`)}
              />
            ),
          },
        ]}
        data={applications}
      />

      {applications.length > 0 || totalPages > 1 ? (
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
