import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Business, Key, Search, Tune } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AppStatCard,
  AppDrawer,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
  AppTableRow,
} from "../../components/design-system";
import { EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  assignCompanyProductLimitApi,
  fetchAdminCompanies,
  resetCompanyPasswordApi,
  setCompanyStatusApi,
  type AdminCompany,
} from "../../services/admin-api";
import { toast } from "../../components/ui/sonner";

type CompanyStatus = AdminCompany["status"];

function statusChipColor(status: CompanyStatus): "success" | "warning" | "error" | "default" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "SUSPENDED" || status === "REJECTED") return "error";
  return "default";
}

export function CompanyManagementPage() {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const locale = language === "ar" ? "ar-EG" : "en-US";

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null);
  const [newLimit, setNewLimit] = useState<number>(10);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-companies", search, status],
    queryFn: () =>
      fetchAdminCompanies({
        page: 1,
        limit: 50,
        search: search || undefined,
        status: status || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
  });

  const companies = data?.items || [];
  const totalRevenue = useMemo(
    () => companies.reduce((sum, company) => sum + (company.revenue || 0), 0),
    [companies]
  );

  const statusMutation = useMutation({
    mutationFn: ({
      companyId,
      action,
      adminNote,
    }: {
      companyId: string;
      action: "approve" | "reject" | "suspend" | "unsuspend";
      adminNote?: string;
    }) => setCompanyStatusApi(companyId, action, adminNote),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      const key =
        variables.action === "approve"
          ? "companies.approveSuccess"
          : variables.action === "reject"
            ? "companies.rejectSuccess"
            : variables.action === "suspend"
              ? "companies.suspendSuccess"
              : "companies.unsuspendSuccess";
      toast.success(t(key));
    },
  });

  const limitMutation = useMutation({
    mutationFn: ({ companyId, maxProducts }: { companyId: string; maxProducts: number }) =>
      assignCompanyProductLimitApi(companyId, maxProducts),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      toast.success(t("companies.limitSuccess"));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ companyId }: { companyId: string }) => resetCompanyPasswordApi(companyId),
    onSuccess: () => toast.success(t("companies.passwordResetSuccess")),
  });

  const statusLabel = (value: CompanyStatus) =>
    t(`companies.status.${value}` as "companies.status.PENDING");

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError) {
    return (
      <EmptyState title={t("companies.loadFailed")} description={(error as Error).message} />
    );
  }

  return (
    <Stack spacing={3}>
      <PageHeader title={t("companies.title")} subtitle={t("companies.subtitle")} />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppStatCard
            title={t("companies.statTotal")}
            value={data?.meta?.total ?? companies.length}
            icon={<Business fontSize="small" />}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppStatCard
            title={t("companies.statApproved")}
            value={companies.filter((c) => c.status === "APPROVED").length}
            trend="up"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppStatCard
            title={t("companies.statPending")}
            value={companies.filter((c) => c.status === "PENDING").length}
            trend="neutral"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <AppStatCard
            title={t("companies.statRevenue")}
            value={`EGP ${totalRevenue.toLocaleString(locale)}`}
            trend="up"
          />
        </Grid>
      </Grid>

      <FilterBar>
        <TextField
          size="small"
          placeholder={t("companies.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: { xs: "100%", sm: 280 } }}
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
          label={t("companies.filterStatus")}
          size="small"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          sx={{ minWidth: 200 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Tune fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        >
          <MenuItem value="">{t("companies.allStatuses")}</MenuItem>
          <MenuItem value="PENDING">{t("companies.status.PENDING")}</MenuItem>
          <MenuItem value="APPROVED">{t("companies.status.APPROVED")}</MenuItem>
          <MenuItem value="REJECTED">{t("companies.status.REJECTED")}</MenuItem>
          <MenuItem value="SUSPENDED">{t("companies.status.SUSPENDED")}</MenuItem>
        </TextField>
      </FilterBar>

      {!companies.length ? (
        <EmptyState title={t("companies.empty")} description={t("companies.emptyHint")} />
      ) : (
        <AppTable>
          <AppTableHead>
            <tr>
              <AppTableHeaderCell>{t("companies.col.company")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.details")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.products")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.revenue")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.rating")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.status")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.actions")}</AppTableHeaderCell>
            </tr>
          </AppTableHead>
          <tbody>
            {companies.map((company) => (
              <AppTableRow key={company.id}>
                <AppTableCell>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        display: "grid",
                        placeItems: "center",
                      }}
                    >
                      <Business fontSize="small" />
                    </Box>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {company.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {company.user?.email || "-"}
                      </Typography>
                    </Box>
                  </Stack>
                </AppTableCell>
                <AppTableCell>
                  <Typography variant="body2">{company.city || "-"}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {company.phone || "-"}
                  </Typography>
                </AppTableCell>
                <AppTableCell>{company.productsCount}</AppTableCell>
                <AppTableCell>EGP {Number(company.revenue || 0).toLocaleString(locale)}</AppTableCell>
                <AppTableCell>{Number(company.rating || 0).toFixed(1)}</AppTableCell>
                <AppTableCell>
                  <Chip
                    size="small"
                    label={statusLabel(company.status)}
                    color={statusChipColor(company.status)}
                    variant="outlined"
                  />
                </AppTableCell>
                <AppTableCell>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                    {company.status === "PENDING" && (
                      <>
                        <Button
                          size="small"
                          color="success"
                          onClick={() =>
                            statusMutation.mutate({
                              companyId: company.id,
                              action: "approve",
                              adminNote: "Approved",
                            })
                          }
                        >
                          {t("companies.approve")}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          onClick={() =>
                            statusMutation.mutate({
                              companyId: company.id,
                              action: "reject",
                              adminNote: "Rejected",
                            })
                          }
                        >
                          {t("companies.reject")}
                        </Button>
                      </>
                    )}
                    {company.status === "APPROVED" && (
                      <Button
                        size="small"
                        color="warning"
                        onClick={() =>
                          statusMutation.mutate({
                            companyId: company.id,
                            action: "suspend",
                            adminNote: "Suspended",
                          })
                        }
                      >
                        {t("companies.suspend")}
                      </Button>
                    )}
                    {company.status === "SUSPENDED" && (
                      <Button
                        size="small"
                        color="success"
                        onClick={() =>
                          statusMutation.mutate({
                            companyId: company.id,
                            action: "unsuspend",
                            adminNote: "Unsuspended",
                          })
                        }
                      >
                        {t("companies.unsuspend")}
                      </Button>
                    )}
                    {(company.status === "APPROVED" || company.status === "SUSPENDED") && (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            setSelectedCompany(company);
                            setNewLimit(company.maxProducts || 10);
                          }}
                        >
                          {t("companies.setLimit")}
                        </Button>
                        <Button
                          size="small"
                          title={t("companies.resetPassword")}
                          onClick={() => resetPasswordMutation.mutate({ companyId: company.id })}
                        >
                          <Key fontSize="small" />
                        </Button>
                      </>
                    )}
                  </Stack>
                </AppTableCell>
              </AppTableRow>
            ))}
          </tbody>
        </AppTable>
      )}

      <AppDrawer
        open={Boolean(selectedCompany)}
        onClose={() => setSelectedCompany(null)}
        title={t("companies.detailsTitle")}
      >
        {selectedCompany ? (
          <Stack spacing={2}>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("companies.fieldName")}:
              </Box>{" "}
              {selectedCompany.name}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("companies.fieldProductsCount")}:
              </Box>{" "}
              {selectedCompany.productsCount}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("companies.fieldProductLimit")}:
              </Box>{" "}
              {selectedCompany.maxProducts}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("companies.fieldRevenue")}:
              </Box>{" "}
              EGP {Number(selectedCompany.revenue || 0).toLocaleString(locale)}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("companies.fieldStatus")}:
              </Box>{" "}
              {statusLabel(selectedCompany.status)}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("companies.fieldRating")}:
              </Box>{" "}
              {Number(selectedCompany.rating || 0).toFixed(1)}
            </Typography>
            <TextField
              label={t("companies.assignLimit")}
              type="number"
              size="small"
              fullWidth
              slotProps={{ htmlInput: { min: 1 } }}
              value={newLimit}
              onChange={(e) => setNewLimit(Number(e.target.value))}
            />
            <Button
              variant="contained"
              fullWidth
              onClick={() =>
                limitMutation.mutate(
                  { companyId: selectedCompany.id, maxProducts: newLimit },
                  { onSuccess: () => setSelectedCompany(null) }
                )
              }
            >
              {t("companies.saveLimit")}
            </Button>
          </Stack>
        ) : null}
      </AppDrawer>
    </Stack>
  );
}
