import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  DescriptionOutlined,
  Inventory2Outlined,
  LocationOnOutlined,
  MailOutlined,
  OpenInNew,
  PhoneOutlined,
  StarOutlined,
  VerifiedOutlined,
} from "@mui/icons-material";
import {
  DetailBackButton,
  DetailHero,
  DetailMediaFrame,
  DetailTwoColumn,
  EmptyState,
  InfoRow,
  MetaItem,
  MetricTile,
  MetricsRow,
  SectionCard,
} from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  approveCompanyWithCredentialsApi,
  assignCompanyProductLimitApi,
  fetchAdminCompanyDetails,
  setCompanyPartnerApi,
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

function companyInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "C";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function DocumentCard({
  title,
  path,
  viewLabel,
}: {
  title: string;
  path?: string;
  viewLabel: string;
}) {
  const href = path ? resolveAssetUrl(path) : null;
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: "8px",
        border: 1,
        borderColor: "divider",
        height: "100%",
        transition: "border-color 0.15s ease",
        "&:hover": href ? { borderColor: "primary.main" } : undefined,
      }}
    >
      <Stack spacing={1.5}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: "8px",
            display: "grid",
            placeItems: "center",
            bgcolor: href ? "rgba(35,103,58,0.1)" : "action.hover",
            color: href ? "primary.main" : "text.disabled",
          }}
        >
          <DescriptionOutlined fontSize="small" />
        </Box>
        <Box>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {title}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {href ? viewLabel : "—"}
          </Typography>
        </Box>
        {href ? (
          <Button
            href={href}
            target="_blank"
            rel="noreferrer"
            size="small"
            variant="outlined"
            endIcon={<OpenInNew sx={{ fontSize: 14 }} />}
            sx={{ borderRadius: "8px", alignSelf: "flex-start" }}
          >
            {viewLabel}
          </Button>
        ) : null}
      </Stack>
    </Box>
  );
}

export function CompanyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useI18n();
  const locale = language === "ar" ? "ar-EG" : "en-US";
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [newLimit, setNewLimit] = useState(10);
  const [maxProducts, setMaxProducts] = useState("10");
  const [displayDays, setDisplayDays] = useState("30");
  const [editDisplayDays, setEditDisplayDays] = useState(30);
  const [editPartnerSortOrder, setEditPartnerSortOrder] = useState(0);
  const [companyEmail, setCompanyEmail] = useState("");
  const [companyPassword, setCompanyPassword] = useState("");
  const [adminNote, setAdminNote] = useState("");
  const [formError, setFormError] = useState("");
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);

  const { data: company, isLoading, isError, error } = useQuery({
    queryKey: ["admin-company-details", id],
    queryFn: () => fetchAdminCompanyDetails(id!),
    enabled: Boolean(id),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-companies"] });
    queryClient.invalidateQueries({ queryKey: ["admin-company-details", id] });
    queryClient.invalidateQueries({ queryKey: ["join-us-applications"] });
    queryClient.invalidateQueries({ queryKey: ["users"] });
  };

  useEffect(() => {
    if (!company) return;
    setNewLimit(company.maxProducts || 10);
    setMaxProducts(String(company.maxProducts || 10));
    setDisplayDays(String(company.displayDays || 30));
    setEditDisplayDays(company.displayDays || 30);
    setEditPartnerSortOrder(company.partnerSortOrder || 0);
    if (company.status === "PENDING" && !credentials) {
      setCompanyEmail(
        prefillCompanyLoginEmail(company.email_public, company.user?.email, company.joinApplication?.email)
      );
      setCompanyPassword((prev) => prev || generatePassword());
    }
  }, [company, credentials]);

  const approveMutation = useMutation({
    mutationFn: (payload: {
      email: string;
      password: string;
      maxProducts: number;
      displayDays: number;
      adminNote?: string;
    }) => approveCompanyWithCredentialsApi(id!, payload),
    onSuccess: (result) => {
      invalidate();
      const creds = result?.credentials;
      if (creds) setCredentials({ email: creds.email, password: creds.password });
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
    mutationFn: (note?: string) => setCompanyStatusApi(id!, "reject", note),
    onSuccess: () => {
      invalidate();
      toast.success(t("companies.rejectSuccess"));
      navigate("/companies");
    },
  });

  const limitMutation = useMutation({
    mutationFn: (payload: { maxProducts: number; displayDays: number }) =>
      assignCompanyProductLimitApi(id!, payload),
    onSuccess: () => {
      invalidate();
      toast.success(t("companies.limitSuccess"));
    },
  });

  const partnerMutation = useMutation({
    mutationFn: (partnerSortOrder: number) => setCompanyPartnerApi(id!, { partnerSortOrder }),
    onSuccess: () => {
      invalidate();
      toast.success(t("companies.limitSuccess"));
    },
  });

  const statusLabel = (value: CompanyStatus) =>
    t(`companies.status.${value}` as "companies.status.PENDING");

  function handleApprove() {
    if (!company) return;
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
    setFormError("");
    approveMutation.mutate({
      email,
      password: companyPassword,
      maxProducts: quota,
      displayDays: days,
      adminNote: adminNote.trim() || undefined,
    });
  }

  const fieldSx = useMemo(
    () => ({ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }),
    []
  );

  if (isLoading) {
    return (
      <Stack sx={{ py: 8, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError || !company) {
    return (
      <EmptyState
        title={t("companies.loadFailed", "Failed to load company")}
        description={(error as Error)?.message}
      />
    );
  }

  const isPending = company.status === "PENDING";
  const email = company.email_public || company.joinApplication?.email;
  const description = company.description || company.joinApplication?.description;
  const licensePath = company.businessLicense || company.joinApplication?.businessLicense;
  const commercialPath = company.commercialReg || company.joinApplication?.commercialReg;

  const heroActions =
    isPending && !credentials ? (
      <>
        <Button
          variant="contained"
          disabled={approveMutation.isPending}
          onClick={handleApprove}
          sx={{ borderRadius: "8px", px: 2.5 }}
        >
          {t("companies.approve")}
        </Button>
        <Button
          variant="outlined"
          color="error"
          disabled={rejectMutation.isPending}
          onClick={() => rejectMutation.mutate(adminNote.trim() || undefined)}
          sx={{ borderRadius: "8px" }}
        >
          {t("companies.reject")}
        </Button>
      </>
    ) : undefined;

  return (
    <Stack spacing={2.5} sx={{ width: "100%", pb: 2 }}>
      <DetailBackButton to="/companies" />

      <DetailHero
        media={<DetailMediaFrame>{companyInitials(company.name)}</DetailMediaFrame>}
        title={company.name}
        status={
          <>
            <Chip
              size="small"
              label={statusLabel(company.status)}
              color={statusChipColor(company.status)}
              variant="outlined"
              sx={{ borderRadius: "8px", fontWeight: 700 }}
            />
            {company.status === "APPROVED" ? (
              <Chip
                size="small"
                icon={<VerifiedOutlined sx={{ fontSize: "16px !important" }} />}
                label={t("companies.verified", "Verified")}
                color="success"
                variant="outlined"
                sx={{ borderRadius: "8px", fontWeight: 600 }}
              />
            ) : null}
            {company.isPartner ? (
              <Chip
                size="small"
                label={t("companies.col.partner", "Partner")}
                color="primary"
                sx={{ borderRadius: "8px", fontWeight: 700 }}
              />
            ) : null}
          </>
        }
        meta={
          <Stack direction="row" spacing={2} useFlexGap sx={{ flexWrap: "wrap", rowGap: 0.75 }}>
            {company.city ? (
              <MetaItem icon={<LocationOnOutlined sx={{ fontSize: 16 }} />}>{company.city}</MetaItem>
            ) : null}
            {company.phone ? (
              <MetaItem icon={<PhoneOutlined sx={{ fontSize: 16 }} />}>{company.phone}</MetaItem>
            ) : null}
            {email ? <MetaItem icon={<MailOutlined sx={{ fontSize: 16 }} />}>{email}</MetaItem> : null}
          </Stack>
        }
        actions={heroActions}
      />

      <MetricsRow>
        <MetricTile
          label={t("companies.fieldProductsCount")}
          value={String(company.productsCount ?? 0)}
          icon={<Inventory2Outlined fontSize="small" />}
        />
        <MetricTile
          label={t("companies.fieldProductLimit")}
          value={String(company.maxProducts ?? "—")}
          icon={<VerifiedOutlined fontSize="small" />}
        />
        <MetricTile
          label={t("companies.fieldRevenue")}
          value={`${t("market.currency")} ${Number(company.revenue || 0).toLocaleString(locale)}`}
          icon={<DescriptionOutlined fontSize="small" />}
        />
        <MetricTile
          label={t("companies.fieldRating")}
          value={Number(company.rating || 0).toFixed(1)}
          icon={<StarOutlined fontSize="small" />}
        />
      </MetricsRow>

      <DetailTwoColumn
        main={
          <>
            <SectionCard title={t("companies.detailsTitle")}>
              <InfoRow label={t("companies.fieldName")} value={company.name} />
              <InfoRow
                label={t("companies.fieldApplicant")}
                value={company.applicantName || company.joinApplication?.fullName}
              />
              <InfoRow label={t("companies.col.phone")} value={company.phone} />
              <InfoRow label={t("companies.fieldEmail")} value={email} />
              <InfoRow label={t("consultants.col.city")} value={company.city} />
              <InfoRow label={t("companies.fieldDisplayDays")} value={String(company.displayDays ?? 30)} />
              <InfoRow
                label={t("companies.fieldListingExpires")}
                value={
                  company.listingExpiresAt
                    ? new Date(company.listingExpiresAt).toLocaleString(locale)
                    : "—"
                }
              />
              {description ? (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ pt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600, mb: 0.75 }}>
                      {t("companies.fieldDescription")}
                    </Typography>
                    <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                      {description}
                    </Typography>
                  </Box>
                </>
              ) : null}
            </SectionCard>

            <SectionCard title={t("companies.fieldBusinessLicense")}>
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                }}
              >
                <DocumentCard
                  title={t("companies.fieldBusinessLicense")}
                  path={licensePath}
                  viewLabel={t("companies.viewFile")}
                />
                <DocumentCard
                  title={t("companies.fieldCommercialReg")}
                  path={commercialPath}
                  viewLabel={t("companies.viewFile")}
                />
              </Box>
            </SectionCard>
          </>
        }
        side={
          <>
            {isPending && !credentials ? (
              <SectionCard title={t("companies.reviewTitle")}>
                <Stack spacing={2}>
                  <TextField
                    label={t("companies.productQuota")}
                    type="number"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { min: 1 } }}
                    value={maxProducts}
                    onChange={(e) => setMaxProducts(e.target.value)}
                    sx={fieldSx}
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
                    sx={fieldSx}
                  />
                  <TextField
                    label={t("companies.loginEmail")}
                    type="email"
                    size="small"
                    fullWidth
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    sx={fieldSx}
                  />
                  <Stack direction="row" spacing={1}>
                    <TextField
                      label={t("companies.loginPassword")}
                      type="text"
                      size="small"
                      fullWidth
                      value={companyPassword}
                      onChange={(e) => setCompanyPassword(e.target.value)}
                      sx={fieldSx}
                    />
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => setCompanyPassword(generatePassword())}
                      sx={{ borderRadius: "8px", whiteSpace: "nowrap" }}
                    >
                      {t("companies.generatePassword")}
                    </Button>
                  </Stack>
                  <TextField
                    label={t("companies.adminNote")}
                    size="small"
                    fullWidth
                    multiline
                    minRows={2}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    sx={fieldSx}
                  />
                  {formError ? (
                    <Alert severity="error" sx={{ borderRadius: "8px" }}>
                      {formError}
                    </Alert>
                  ) : null}
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    <Button
                      variant="contained"
                      disabled={approveMutation.isPending}
                      onClick={handleApprove}
                      sx={{ borderRadius: "8px" }}
                    >
                      {t("companies.approve")}
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      disabled={rejectMutation.isPending}
                      onClick={() => rejectMutation.mutate(adminNote.trim() || undefined)}
                      sx={{ borderRadius: "8px" }}
                    >
                      {t("companies.reject")}
                    </Button>
                  </Stack>
                </Stack>
              </SectionCard>
            ) : null}

            {credentials ? (
              <SectionCard title={t("companies.accountCreated")}>
                <Stack spacing={2}>
                  <Alert severity="success" sx={{ borderRadius: "8px" }}>
                    {t("companies.credentialsHint")}
                  </Alert>
                  <InfoRow label={t("companies.fieldEmail")} value={credentials.email} />
                  <InfoRow label={t("companies.loginPassword")} value={credentials.password} />
                  <Button
                    variant="outlined"
                    sx={{ borderRadius: "8px", alignSelf: "flex-start" }}
                    onClick={() => navigate("/companies")}
                  >
                    {t("companies.close")}
                  </Button>
                </Stack>
              </SectionCard>
            ) : null}

            {!isPending ? (
              <SectionCard title={t("companies.setLimit")}>
                <Stack spacing={2}>
                  <TextField
                    label={t("companies.assignLimit")}
                    type="number"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { min: 1 } }}
                    value={newLimit}
                    onChange={(e) => setNewLimit(Number(e.target.value))}
                    sx={fieldSx}
                  />
                  <TextField
                    label={t("companies.displayDays")}
                    type="number"
                    size="small"
                    fullWidth
                    helperText={t("companies.displayDaysHint")}
                    slotProps={{ htmlInput: { min: 1 } }}
                    value={editDisplayDays}
                    onChange={(e) => setEditDisplayDays(Number(e.target.value))}
                    sx={fieldSx}
                  />
                  <Button
                    variant="contained"
                    onClick={() =>
                      limitMutation.mutate({ maxProducts: newLimit, displayDays: editDisplayDays })
                    }
                    disabled={limitMutation.isPending}
                    sx={{ borderRadius: "8px", alignSelf: "flex-start" }}
                  >
                    {t("companies.saveLimit")}
                  </Button>
                  <Divider />
                  <TextField
                    label={t("companies.fieldPartnerSortOrder")}
                    type="number"
                    size="small"
                    fullWidth
                    disabled={company.status !== "APPROVED"}
                    slotProps={{ htmlInput: { min: 0 } }}
                    value={editPartnerSortOrder}
                    onChange={(e) => setEditPartnerSortOrder(Number(e.target.value))}
                    sx={fieldSx}
                  />
                  <Button
                    variant="outlined"
                    disabled={company.status !== "APPROVED" || partnerMutation.isPending}
                    onClick={() => partnerMutation.mutate(editPartnerSortOrder)}
                    sx={{ borderRadius: "8px", alignSelf: "flex-start" }}
                  >
                    {t("companies.savePartnerOrder")}
                  </Button>
                </Stack>
              </SectionCard>
            ) : null}
          </>
        }
      />
    </Stack>
  );
}
