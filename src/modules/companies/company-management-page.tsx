import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Business, ContentCopy, Key, Search, Tune } from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import {
  AppStatCard,
  AppModal,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
  AppTableRow,
} from "../../components/design-system";
import { EmptyState, FilterBar, PageHeader, TableRowActions } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  fetchAdminCompanies,
  resetCompanyPasswordApi,
  setCompanyPartnerApi,
  setCompanyStatusApi,
  type AdminCompany,
} from "../../services/admin-api";
import { generatePassword } from "../../utils/generate-password";
import { prefillCompanyLoginEmail } from "../../utils/company-approval-email";
import { formatCurrency, formatDate } from "../../utils/format";
import { toast } from "../../components/ui/sonner";

type CompanyStatus = AdminCompany["status"];

function statusChipColor(status: CompanyStatus): "success" | "warning" | "error" | "default" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "SUSPENDED" || status === "REJECTED") return "error";
  return "default";
}

const companyActionKeySlotSx = { width: 28, height: 28 } as const;

function companyActionsGridSx(language: "ar" | "en") {
  const primaryCol = language === "ar" ? "116px" : "84px";
  const secondaryCol = language === "ar" ? "96px" : "92px";
  return {
    display: "grid",
    gridTemplateColumns: `${primaryCol} 28px ${secondaryCol}`,
    columnGap: 1,
    alignItems: "center",
    width: "max-content",
  } as const;
}

const companyActionPrimaryBtnSx = {
  width: "100%",
  minWidth: 0,
  justifySelf: "stretch",
  px: 0.75,
  whiteSpace: "nowrap",
} as const;

const companyActionSecondaryBtnSx = {
  width: "100%",
  minWidth: 0,
  justifySelf: "stretch",
  whiteSpace: "nowrap",
} as const;

export function CompanyManagementPage() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [resetPasswordCompany, setResetPasswordCompany] = useState<AdminCompany | null>(null);
  const [resetPasswordInput, setResetPasswordInput] = useState("");
  const [resetPasswordResult, setResetPasswordResult] = useState<{
    email: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["admin-companies", debouncedSearch, status],
    queryFn: () =>
      fetchAdminCompanies({
        page: 1,
        limit: 50,
        search: debouncedSearch || undefined,
        status: status || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      }),
    placeholderData: (previousData) => previousData,
  });

  const companies = data?.items || [];
  const totalRevenue = useMemo(
    () => companies.reduce((sum, company) => sum + (company.revenue || 0), 0),
    [companies]
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    queryClient.invalidateQueries({ queryKey: ["join-us-applications"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  const statusMutation = useMutation({
    mutationFn: ({
      companyId,
      action,
      adminNote: note,
    }: {
      companyId: string;
      action: "suspend" | "unsuspend";
      adminNote?: string;
    }) => setCompanyStatusApi(companyId, action, note),
    onSuccess: (_data, variables) => {
      invalidate();
      toast.success(
        variables.action === "suspend" ? t("companies.suspendSuccess") : t("companies.unsuspendSuccess")
      );
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ companyId, adminNote: note }: { companyId: string; adminNote?: string }) =>
      setCompanyStatusApi(companyId, "reject", note),
    onSuccess: () => {
      invalidate();
      toast.success(t("companies.rejectSuccess"));
    },
  });

  const partnerMutation = useMutation({
    mutationFn: ({
      companyId,
      isPartner,
      partnerSortOrder,
    }: {
      companyId: string;
      isPartner?: boolean;
      partnerSortOrder?: number;
    }) => setCompanyPartnerApi(companyId, { isPartner, partnerSortOrder }),
    onSuccess: () => {
      invalidate();
      toast.success(t("companies.limitSuccess"));
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: ({ companyId, newPassword }: { companyId: string; newPassword: string }) =>
      resetCompanyPasswordApi(companyId, newPassword),
    onSuccess: (result) => {
      setResetPasswordResult({
        email: resetPasswordCompany?.user?.email || prefillCompanyLoginEmail(resetPasswordCompany?.email_public) || "-",
        password: result.generatedPassword,
      });
      toast.success(t("companies.passwordResetDone"));
    },
    onError: (err: unknown) => {
      const message =
        axios.isAxiosError(err) &&
        err.response?.data &&
        typeof err.response.data === "object" &&
        "message" in err.response.data
          ? String((err.response.data as { message: string }).message)
          : err instanceof Error
            ? err.message
            : t("companies.reviewFailed");
      toast.error(message);
    },
  });

  const statusLabel = (value: CompanyStatus) =>
    t(`companies.status.${value}` as "companies.status.PENDING");

  function openResetPassword(company: AdminCompany) {
    setResetPasswordCompany(company);
    setResetPasswordInput(generatePassword());
    setResetPasswordResult(null);
  }

  function closeResetPassword() {
    setResetPasswordCompany(null);
    setResetPasswordInput("");
    setResetPasswordResult(null);
  }

  function submitResetPassword() {
    if (!resetPasswordCompany) return;
    const password = resetPasswordInput.trim();
    if (password.length < 6) {
      toast.error(t("companies.passwordMin"));
      return;
    }
    resetPasswordMutation.mutate({ companyId: resetPasswordCompany.id, newPassword: password });
  }

  async function copyResetPassword() {
    if (!resetPasswordResult?.password) return;
    await navigator.clipboard.writeText(resetPasswordResult.password);
    toast.success(t("companies.passwordCopied"));
  }

  if (isLoading && !data) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError) {
    return <EmptyState title={t("companies.loadFailed")} description={(error as Error).message} />;
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
            value={formatCurrency(totalRevenue, language, t("market.currency"))}
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
              endAdornment: isFetching ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : undefined,
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
        <EmptyState
          title={debouncedSearch || status ? t("companies.noResults") : t("companies.empty")}
          description={t("companies.emptyHint")}
        />
      ) : (
        <AppTable>
          <AppTableHead>
            <tr>
              <AppTableHeaderCell>{t("companies.col.company")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.details")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.products")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.fieldListingExpires")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.revenue")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.rating")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.status")}</AppTableHeaderCell>
              <AppTableHeaderCell>{t("companies.col.partner")}</AppTableHeaderCell>
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
                <AppTableCell>
                  {company.listingExpiresAt
                    ? formatDate(company.listingExpiresAt, language)
                    : company.status === "APPROVED"
                      ? t("companies.listingActive")
                      : "-"}
                </AppTableCell>
                <AppTableCell>
                  {formatCurrency(company.revenue, language, t("market.currency"))}
                </AppTableCell>
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
                  <Switch
                    size="small"
                    checked={Boolean(company.isPartner)}
                    disabled={company.status !== "APPROVED" || partnerMutation.isPending}
                    onChange={(e) =>
                      partnerMutation.mutate({ companyId: company.id, isPartner: e.target.checked })
                    }
                  />
                </AppTableCell>
                <AppTableCell>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "nowrap" }}>
                    <TableRowActions
                      onView={() => navigate(`/companies/${company.id}`)}
                      onEdit={() => navigate(`/companies/${company.id}`)}
                    />
                  <Box sx={companyActionsGridSx(language)}>
                    {company.status === "PENDING" ? (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          sx={companyActionPrimaryBtnSx}
                          onClick={() => navigate(`/companies/${company.id}`)}
                        >
                          {t("companies.review")}
                        </Button>
                        <Box aria-hidden sx={companyActionKeySlotSx} />
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          sx={companyActionSecondaryBtnSx}
                          onClick={() =>
                            rejectMutation.mutate({ companyId: company.id, adminNote: t("companies.reject") })
                          }
                        >
                          {t("companies.reject")}
                        </Button>
                      </>
                    ) : null}
                    {company.status === "APPROVED" ? (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          sx={companyActionPrimaryBtnSx}
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
                        <Tooltip title={t("companies.resetPassword")}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openResetPassword(company)}
                            sx={{
                              border: 1,
                              borderColor: "divider",
                              borderRadius: 1,
                              ...companyActionKeySlotSx,
                              justifySelf: "center",
                            }}
                          >
                            <Key sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={companyActionSecondaryBtnSx}
                          onClick={() => navigate(`/companies/${company.id}`)}
                        >
                          {t("companies.setLimit")}
                        </Button>
                      </>
                    ) : null}
                    {company.status === "SUSPENDED" ? (
                      <>
                        <Button
                          size="small"
                          variant="outlined"
                          color="success"
                          sx={companyActionPrimaryBtnSx}
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
                        <Tooltip title={t("companies.resetPassword")}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openResetPassword(company)}
                            sx={{
                              border: 1,
                              borderColor: "divider",
                              borderRadius: 1,
                              ...companyActionKeySlotSx,
                              justifySelf: "center",
                            }}
                          >
                            <Key sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Button
                          size="small"
                          variant="outlined"
                          sx={companyActionSecondaryBtnSx}
                          onClick={() => navigate(`/companies/${company.id}`)}
                        >
                          {t("companies.setLimit")}
                        </Button>
                      </>
                    ) : null}
                  </Box>
                  </Stack>
                </AppTableCell>
              </AppTableRow>
            ))}
          </tbody>
        </AppTable>
      )}


      <AppModal
        open={Boolean(resetPasswordCompany)}
        onClose={closeResetPassword}
        title={t("companies.resetPasswordTitle")}
        description={t("companies.resetPasswordHint")}
        footer={
          resetPasswordResult ? (
            <Button variant="contained" onClick={closeResetPassword}>
              {t("companies.close")}
            </Button>
          ) : (
            <Stack direction="row" spacing={1}>
              <Button variant="outlined" onClick={closeResetPassword}>
                {t("companies.cancel")}
              </Button>
              <Button
                variant="contained"
                disabled={resetPasswordMutation.isPending}
                onClick={submitResetPassword}
              >
                {t("companies.confirmResetPassword")}
              </Button>
            </Stack>
          )
        }
      >
        {resetPasswordCompany ? (
          <Stack spacing={2}>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("companies.fieldName")}:
              </Box>{" "}
              {resetPasswordCompany.name}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("companies.loginEmail")}:
              </Box>{" "}
              {resetPasswordCompany.user?.email ||
                prefillCompanyLoginEmail(resetPasswordCompany.email_public) ||
                "-"}
            </Typography>

            {resetPasswordResult ? (
              <Paper variant="outlined" sx={{ p: 2, borderColor: "primary.light" }}>
                <Typography variant="subtitle2" color="primary.main" gutterBottom>
                  {t("companies.passwordResetDone")}
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: "monospace", wordBreak: "break-all" }}>
                  {resetPasswordResult.password}
                </Typography>
                <Button
                  size="small"
                  startIcon={<ContentCopy fontSize="small" />}
                  sx={{ mt: 1.5 }}
                  onClick={copyResetPassword}
                >
                  {t("companies.copyPassword")}
                </Button>
              </Paper>
            ) : (
              <Stack direction="row" spacing={1}>
                <TextField
                  label={t("companies.newPassword")}
                  size="small"
                  fullWidth
                  value={resetPasswordInput}
                  onChange={(e) => setResetPasswordInput(e.target.value)}
                />
                <Button
                  variant="outlined"
                  sx={{ flexShrink: 0, alignSelf: "flex-end" }}
                  onClick={() => setResetPasswordInput(generatePassword())}
                >
                  {t("companies.generatePassword")}
                </Button>
              </Stack>
            )}
          </Stack>
        ) : null}
      </AppModal>
    </Stack>
  );
}
