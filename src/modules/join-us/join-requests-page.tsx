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
import {
  fetchJoinUsApplications,
  fetchJoinApplicationTypes,
  type JoinUsApplicationListItem,
  type JoinApplicationType,
  type JoinUsTab,
} from "../../services/admin-api";
import { JoinApplicationTypesDrawer } from "./join-application-types-drawer";

const TAB_ALL = "ALL" as const;

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
  const [typesDrawerOpen, setTypesDrawerOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  useEffect(() => {
    setPage(1);
  }, [search, status, tab, pageSize]);

  const { data: joinTypes = [] } = useQuery({
    queryKey: ["join-application-types"],
    queryFn: fetchJoinApplicationTypes,
  });

  const typesByCode = useMemo(() => {
    const map = new Map<string, JoinApplicationType>();
    joinTypes.forEach((type) => map.set(type.code, type));
    return map;
  }, [joinTypes]);

  const typeLabel = (type: string) => {
    const row = typesByCode.get(type);
    if (row) return language === "ar" ? row.nameAr || row.nameEn : row.nameEn || row.nameAr;
    return t(`joinUs.type.${type}` as "joinUs.type.COMPANY") || type;
  };

  const tabItems = useMemo(() => {
    const active = joinTypes.filter((type) => type.isActive);
    return [
      { code: TAB_ALL, label: t("joinUs.tab.all") },
      ...active.map((type) => ({
        code: type.code,
        label: language === "ar" ? type.nameAr || type.nameEn : type.nameEn || type.nameAr,
      })),
    ];
  }, [joinTypes, language, t]);

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
          <Button variant="outlined" startIcon={<Settings />} onClick={() => setTypesDrawerOpen(true)}>
            {t("joinUs.types.manage")}
          </Button>
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

      <JoinApplicationTypesDrawer open={typesDrawerOpen} onClose={() => setTypesDrawerOpen(false)} />
    </Stack>
  );
}
