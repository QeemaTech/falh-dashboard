import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { Search, Settings } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  InputAdornment,
  Link,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { AppDrawer } from "../../components/design-system";
import { DataTable, EmptyState, FilterBar, PageHeader } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  approveJoinUsApplicationApi,
  fetchJoinUsApplicationById,
  fetchJoinUsApplications,
  fetchJoinApplicationTypes,
  rejectJoinUsApplicationApi,
  type JoinUsApplicationListItem,
  type JoinApplicationType,
  type JoinUsTab,
} from "../../services/admin-api";
import { JoinApplicationTypesDrawer } from "./join-application-types-drawer";
import { resolveAssetUrl } from "../../utils/asset-url";
import { generatePassword } from "../../utils/generate-password";
import { prefillCompanyLoginEmail } from "../../utils/company-approval-email";

const TAB_ALL = "ALL" as const;

type JoinRequestRow = JoinUsApplicationListItem & Record<string, unknown>;

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  return "error";
}

function AssetLink({ path, label }: { path?: string; label: string }) {
  if (!path) return <span>-</span>;
  const url = resolveAssetUrl(path);
  return (
    <Link href={url} target="_blank" rel="noreferrer">
      {label}
    </Link>
  );
}

export function JoinRequestsPage() {
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("PENDING");
  const [tab, setTab] = useState<JoinUsTab>(TAB_ALL);
  const [typesDrawerOpen, setTypesDrawerOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [maxProducts, setMaxProducts] = useState("10");
  const [displayDays, setDisplayDays] = useState("30");
  const [adminNote, setAdminNote] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

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
    return [{ code: TAB_ALL, label: t("joinUs.tab.all") }, ...active.map((type) => ({
      code: type.code,
      label: language === "ar" ? type.nameAr || type.nameEn : type.nameEn || type.nameAr,
    }))];
  }, [joinTypes, language, t]);

  const statusLabel = (value: string) =>
    t(`joinUs.status.${value}` as "joinUs.status.PENDING") || value;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["join-us-applications", search, status, tab],
    queryFn: () =>
      fetchJoinUsApplications({
        page: 1,
        limit: 50,
        search: search || undefined,
        status: status || undefined,
        tab,
      }),
  });

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ["join-us-application", selectedId],
    queryFn: () => fetchJoinUsApplicationById(selectedId!),
    enabled: Boolean(selectedId),
  });

  const reviewMutation = useMutation({
    mutationFn: async (payload: { action: "APPROVE" | "REJECT" }) => {
      if (!selectedId || !detail) throw new Error("No application selected");
      if (payload.action === "REJECT") {
        return rejectJoinUsApplicationApi(selectedId, {
          adminNote: adminNote.trim() || undefined,
        });
      }
      return approveJoinUsApplicationApi(selectedId, {
        email: detail.applicationType === "COMPANY" ? companyEmail.trim().toLowerCase() : undefined,
        password: detail.applicationType === "COMPANY" ? companyPassword : undefined,
        maxProducts: detail.applicationType === "COMPANY" ? Number(maxProducts) : undefined,
        displayDays: detail.applicationType === "COMPANY" ? Number(displayDays) : undefined,
        adminNote: adminNote.trim() || undefined,
      });
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ["join-us-applications"] });
      queryClient.invalidateQueries({ queryKey: ["join-us-application"] });
      queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
      queryClient.invalidateQueries({ queryKey: ["admin-service-providers"] });
      queryClient.invalidateQueries({ queryKey: ["users"] });
      const creds =
        result && typeof result === "object" && "credentials" in result
          ? (result as { credentials?: { email: string; password: string } }).credentials
          : null;
      if (variables.action === "APPROVE" && creds) {
        setCredentials({ email: creds.email, password: creds.password });
      } else {
        setSelectedId(null);
        setCredentials(null);
      }
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

  const applications = (data?.items || []) as JoinRequestRow[];

  const isCompanyReview = detail?.review.kind === "company";
  const reviewFields = detail?.review.fields || {};

  useEffect(() => {
    if (!detail || detail.applicationType !== "COMPANY" || credentials) return;
    const suggested = prefillCompanyLoginEmail(
      detail.email,
      reviewFields.email as string | undefined
    );
    if (suggested) setCompanyEmail(suggested);
  }, [detail, credentials, reviewFields.email]);

  function openReview(item: JoinUsApplicationListItem) {
    setSelectedId(item.id);
    setMaxProducts("10");
    setDisplayDays("30");
    setAdminNote("");
    setCompanyEmail(prefillCompanyLoginEmail(item.email));
    setCompanyPassword(generatePassword());
    setFormError("");
    setCredentials(null);
  }

  function handleApprove() {
    if (!detail) return;
    if (detail.applicationType === "COMPANY") {
      const quota = Number(maxProducts);
      const days = Number(displayDays);
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
      if (!Number.isInteger(days) || days < 1) {
        setFormError(t("companies.displayDaysMin"));
        return;
      }
    }
    setFormError("");
    reviewMutation.mutate({ action: "APPROVE" });
  }

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
              <Button size="small" onClick={() => openReview(row)}>
                {t("joinUs.view")}
              </Button>
            ),
          },
        ]}
        data={applications}
      />

      <AppDrawer
        open={Boolean(selectedId)}
        onClose={() => {
          setSelectedId(null);
          setCredentials(null);
        }}
        title={t("joinUs.reviewTitle")}
        width={480}
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
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("joinUs.fieldType")}:
              </Box>{" "}
              {typeLabel(detail.applicationType)}
            </Typography>
            <Typography variant="body2">
              <Box component="span" sx={{ fontWeight: 600 }}>
                {t("joinUs.fieldStatus")}:
              </Box>{" "}
              {statusLabel(detail.status)}
            </Typography>

            {isCompanyReview ? (
              <>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldCompanyName")}:
                  </Box>{" "}
                  {String(reviewFields.companyName || detail.companyName || "-")}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldApplicant")}:
                  </Box>{" "}
                  {String(reviewFields.applicantName || detail.fullName)}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldPhone")}:
                  </Box>{" "}
                  {String(reviewFields.phone || detail.phone)}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldEmail")}:
                  </Box>{" "}
                  {String(reviewFields.email || detail.email || "-")}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldCity")}:
                  </Box>{" "}
                  {String(reviewFields.city || detail.city)}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldDescription")}:
                  </Box>{" "}
                  {String(reviewFields.description || detail.description || "-")}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("companies.fieldBusinessLicense")}:
                  </Box>{" "}
                  <AssetLink
                    path={String(reviewFields.businessLicense || detail.businessLicense || "")}
                    label={t("joinUs.viewFile")}
                  />
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("companies.fieldCommercialReg")}:
                  </Box>{" "}
                  <AssetLink
                    path={String(reviewFields.commercialReg || detail.commercialReg || "")}
                    label={t("joinUs.viewFile")}
                  />
                </Typography>

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
                  label={t("companies.displayDays")}
                  type="number"
                  size="small"
                  fullWidth
                  helperText={t("companies.displayDaysHint")}
                  slotProps={{ htmlInput: { min: 1 } }}
                  value={displayDays}
                  onChange={(e) => setDisplayDays(e.target.value)}
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
              </>
            ) : (
              <>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldFullName")}:
                  </Box>{" "}
                  {String(reviewFields.fullName || detail.fullName)}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldCity")}:
                  </Box>{" "}
                  {String(reviewFields.city || detail.city)}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldWhatsapp")}:
                  </Box>{" "}
                  {String(reviewFields.whatsapp || detail.whatsappNumber || "-")}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldPhone")}:
                  </Box>{" "}
                  {String(reviewFields.phone || detail.phone)}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldBio")}:
                  </Box>{" "}
                  {String(reviewFields.bio || detail.bio || "-")}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldSpecializations")}:
                  </Box>{" "}
                  {Array.isArray(reviewFields.specializations)
                    ? (reviewFields.specializations as string[]).join(", ") || "-"
                    : (detail.specializations || []).join(", ") || "-"}
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldExperience")}:
                  </Box>{" "}
                  {String(reviewFields.experience ?? detail.yearsOfExperience ?? "-")} {t("joinUs.years")}
                </Typography>
                {detail.otherTypeLabel ? (
                  <Typography variant="body2">
                    <Box component="span" sx={{ fontWeight: 600 }}>
                      {t("joinUs.fieldOtherType")}:
                    </Box>{" "}
                    {detail.otherTypeLabel}
                  </Typography>
                ) : null}
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldIdImage")}:
                  </Box>{" "}
                  <AssetLink path={String(reviewFields.idImage || detail.idImage || "")} label={t("joinUs.viewFile")} />
                </Typography>
                <Typography variant="body2">
                  <Box component="span" sx={{ fontWeight: 600 }}>
                    {t("joinUs.fieldLicenseImage")}:
                  </Box>{" "}
                  <AssetLink
                    path={String(reviewFields.licenseImage || detail.licenseImage || "")}
                    label={t("joinUs.viewFile")}
                  />
                </Typography>
              </>
            )}

            <TextField
              label={t("companies.adminNote")}
              size="small"
              fullWidth
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
            />

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
                <Button
                  sx={{ mt: 1 }}
                  onClick={() => {
                    setSelectedId(null);
                    setCredentials(null);
                  }}
                >
                  {t("companies.close")}
                </Button>
              </Paper>
            ) : null}

            {formError ? <Alert severity="error">{formError}</Alert> : null}

            {!credentials && detail.status === "PENDING" ? (
              <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                <Button variant="contained" disabled={reviewMutation.isPending} onClick={handleApprove}>
                  {detail.applicationType === "COMPANY"
                    ? t("joinUs.approveCompany")
                    : t("joinUs.approveProvider")}
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  disabled={reviewMutation.isPending}
                  onClick={() => reviewMutation.mutate({ action: "REJECT" })}
                >
                  {t("joinUs.reject")}
                </Button>
              </Stack>
            ) : null}
          </Stack>
        ) : null}
      </AppDrawer>

      <JoinApplicationTypesDrawer open={typesDrawerOpen} onClose={() => setTypesDrawerOpen(false)} />
    </Stack>
  );
}
