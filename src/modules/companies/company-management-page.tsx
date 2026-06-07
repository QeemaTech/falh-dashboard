import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Business, ContentCopy, Key, Search, Tune } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AppStatCard,
  AppDrawer,
  AppModal,
  AppTable,
  AppTableCell,
  AppTableHead,
  AppTableHeaderCell,
  AppTableRow,
} from "../../components/design-system";
import { EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  approveCompanyWithCredentialsApi,
  assignCompanyProductLimitApi,
  fetchAdminCompanies,
  fetchAdminCompanyDetails,
  resetCompanyPasswordApi,
  setCompanyStatusApi,
  type AdminCompany,
} from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import { generatePassword } from "../../utils/generate-password";
import { prefillCompanyLoginEmail } from "../../utils/company-approval-email";
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

function DetailLine({ label, value }: { label: string; value?: string | null }) {
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

function AssetLink({ path, label }: { path?: string; label: string }) {
  if (!path) return <span>-</span>;
  return (
    <Link href={resolveAssetUrl(path)} target="_blank" rel="noreferrer">
      {label}
    </Link>
  );
}

export function CompanyManagementPage() {
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const locale = language === "ar" ? "ar-EG" : "en-US";

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<AdminCompany | null>(null);
  const [reviewCompanyId, setReviewCompanyId] = useState<string | null>(null);
  const [newLimit, setNewLimit] = useState<number>(10);
  const [maxProducts, setMaxProducts] = useState("10");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [formError, setFormError] = useState("");
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
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

  const { data: reviewDetail, isLoading: reviewLoading } = useQuery({
    queryKey: ["admin-company-details", reviewCompanyId],
    queryFn: () => fetchAdminCompanyDetails(reviewCompanyId!),
    enabled: Boolean(reviewCompanyId),
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

  const approveMutation = useMutation({
    mutationFn: (payload: { companyId: string; email: string; password: string; maxProducts: number; adminNote?: string }) =>
      approveCompanyWithCredentialsApi(payload.companyId, {
        email: payload.email,
        password: payload.password,
        maxProducts: payload.maxProducts,
        adminNote: payload.adminNote,
      }),
    onSuccess: (result) => {
      invalidate();
      const creds = result?.credentials;
      if (creds) {
        setCredentials({ email: creds.email, password: creds.password });
      } else {
        closeReview();
      }
      toast.success(t("companies.approveSuccess"));
      setFormError("");
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
      setFormError(message);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ companyId, adminNote: note }: { companyId: string; adminNote?: string }) =>
      setCompanyStatusApi(companyId, "reject", note),
    onSuccess: () => {
      invalidate();
      closeReview();
      toast.success(t("companies.rejectSuccess"));
    },
  });

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

  const limitMutation = useMutation({
    mutationFn: ({ companyId, maxProducts: limit }: { companyId: string; maxProducts: number }) =>
      assignCompanyProductLimitApi(companyId, limit),
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

  useEffect(() => {
    if (!reviewDetail || reviewDetail.status !== "PENDING" || credentials) return;
    const suggested = prefillCompanyLoginEmail(
      reviewDetail.joinApplication?.email,
      reviewDetail.email_public,
      reviewDetail.user?.email
    );
    if (suggested) setCompanyEmail(suggested);
  }, [reviewDetail, credentials]);

  function openReview(company: AdminCompany) {
    setReviewCompanyId(company.id);
    setMaxProducts(String(company.maxProducts || 10));
    setCompanyEmail(prefillCompanyLoginEmail(company.email_public, company.user?.email));
    setCompanyPassword(generatePassword());
    setAdminNote("");
    setFormError("");
    setCredentials(null);
  }

  function closeReview() {
    setReviewCompanyId(null);
    setCredentials(null);
    setFormError("");
  }

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

  function handleApprove() {
    if (!reviewCompanyId) return;
    const quota = Number(maxProducts);
    const email = companyEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError(t("companies.invalidEmail"));
      return;
    }
    if (!companyPassword || companyPassword.length < 6) {
      setFormError(t("companies.passwordMin"));
      return;
    }
    if (!Number.isInteger(quota) || quota < 1) {
      setFormError(t("companies.quotaMin"));
      return;
    }
    approveMutation.mutate({
      companyId: reviewCompanyId,
      email,
      password: companyPassword,
      maxProducts: quota,
      adminNote: adminNote.trim() || undefined,
    });
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
            value={`${t("market.currency")} ${totalRevenue.toLocaleString(locale)}`}
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
                <AppTableCell>
                  {t("market.currency")} {Number(company.revenue || 0).toLocaleString(locale)}
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
                  <Box sx={companyActionsGridSx(language)}>
                    {company.status === "PENDING" ? (
                      <>
                        <Button
                          size="small"
                          variant="contained"
                          sx={companyActionPrimaryBtnSx}
                          onClick={() => openReview(company)}
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
                          variant="text"
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
                          onClick={() => {
                            setSelectedCompany(company);
                            setNewLimit(company.maxProducts || 10);
                          }}
                        >
                          {t("companies.setLimit")}
                        </Button>
                      </>
                    ) : null}
                    {company.status === "SUSPENDED" ? (
                      <>
                        <Button
                          size="small"
                          variant="text"
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
                          onClick={() => {
                            setSelectedCompany(company);
                            setNewLimit(company.maxProducts || 10);
                          }}
                        >
                          {t("companies.setLimit")}
                        </Button>
                      </>
                    ) : null}
                  </Box>
                </AppTableCell>
              </AppTableRow>
            ))}
          </tbody>
        </AppTable>
      )}

      <AppDrawer
        open={Boolean(reviewCompanyId)}
        onClose={closeReview}
        title={t("companies.reviewTitle")}
        width={480}
      >
        {reviewLoading ? (
          <Stack sx={{ py: 4, alignItems: "center" }}>
            <CircularProgress size={28} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              {t("common.loading")}
            </Typography>
          </Stack>
        ) : null}

        {reviewDetail && !reviewLoading ? (
          <Stack spacing={2}>
            <DetailLine label={t("companies.fieldName")} value={reviewDetail.name} />
            <DetailLine
              label={t("companies.fieldApplicant")}
              value={reviewDetail.applicantName || reviewDetail.joinApplication?.fullName}
            />
            <DetailLine label={t("companies.col.phone")} value={reviewDetail.phone} />
            <DetailLine
              label={t("companies.fieldEmail")}
              value={reviewDetail.email_public || reviewDetail.joinApplication?.email}
            />
            <DetailLine label={t("consultants.col.city")} value={reviewDetail.city} />
            <DetailLine
              label={t("companies.fieldDescription")}
              value={reviewDetail.description || reviewDetail.joinApplication?.description}
            />
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("companies.fieldBusinessLicense")}:
              </Box>{" "}
              <AssetLink
                path={reviewDetail.businessLicense || reviewDetail.joinApplication?.businessLicense}
                label={t("companies.viewFile")}
              />
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("companies.fieldCommercialReg")}:
              </Box>{" "}
              <AssetLink
                path={reviewDetail.commercialReg || reviewDetail.joinApplication?.commercialReg}
                label={t("companies.viewFile")}
              />
            </Typography>

            {!credentials ? (
              <>
                <TextField
                  label={t("companies.productQuota")}
                  type="number"
                  size="small"
                  fullWidth
                  slotProps={{ htmlInput: { min: 1 } }}
                  value={maxProducts}
                  onChange={(e) => setMaxProducts(e.target.value)}
                />
                <TextField
                  label={t("companies.loginEmail")}
                  type="email"
                  size="small"
                  fullWidth
                  value={companyEmail}
                  onChange={(e) => setCompanyEmail(e.target.value)}
                />
                <Stack direction="row" spacing={1}>
                  <TextField
                    label={t("companies.loginPassword")}
                    type="text"
                    size="small"
                    fullWidth
                    value={companyPassword}
                    onChange={(e) => setCompanyPassword(e.target.value)}
                  />
                  <Button type="button" variant="outlined" onClick={() => setCompanyPassword(generatePassword())}>
                    {t("companies.generatePassword")}
                  </Button>
                </Stack>
                <TextField
                  label={t("companies.adminNote")}
                  size="small"
                  fullWidth
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </>
            ) : null}

            {credentials ? (
              <Paper variant="outlined" sx={{ p: 2, borderColor: "primary.light" }}>
                <Typography variant="subtitle2" color="primary.main" gutterBottom>
                  {t("companies.accountCreated")}
                </Typography>
                <Typography variant="body2">
                  {t("companies.fieldEmail")}: {credentials.email}
                </Typography>
                <Typography variant="body2">
                  {t("companies.loginPassword")}: {credentials.password}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                  {t("companies.credentialsHint")}
                </Typography>
                <Button sx={{ mt: 1 }} onClick={closeReview}>
                  {t("companies.close")}
                </Button>
              </Paper>
            ) : null}

            {formError ? <Alert severity="error">{formError}</Alert> : null}

            {!credentials && reviewDetail.status === "PENDING" ? (
              <Stack direction="row" spacing={1}>
                <Button variant="contained" disabled={approveMutation.isPending} onClick={handleApprove}>
                  {t("companies.approve")}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={rejectMutation.isPending}
                  onClick={() =>
                    rejectMutation.mutate({
                      companyId: reviewDetail.id,
                      adminNote: adminNote.trim() || undefined,
                    })
                  }
                >
                  {t("companies.reject")}
                </Button>
              </Stack>
            ) : null}
          </Stack>
        ) : null}
      </AppDrawer>

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
              {t("market.currency")} {Number(selectedCompany.revenue || 0).toLocaleString(locale)}
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
