import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DetailField, DetailGrid, DetailPageShell, EmptyState } from "../../components/layout";
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

function AssetLink({ path, label }: { path?: string; label: string }) {
  if (!path) return <span>-</span>;
  return (
    <Link href={resolveAssetUrl(path)} target="_blank" rel="noreferrer">
      {label}
    </Link>
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
      setCompanyEmail(prefillCompanyLoginEmail(company.email_public, company.user?.email, company.joinApplication?.email));
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
      if (creds) {
        setCredentials({ email: creds.email, password: creds.password });
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
    mutationFn: (partnerSortOrder: number) =>
      setCompanyPartnerApi(id!, { partnerSortOrder }),
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

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
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

  return (
    <DetailPageShell
      title={company.name}
      subtitle={company.city || undefined}
      backTo="/companies"
      status={
        <Chip
          size="small"
          label={statusLabel(company.status)}
          color={statusChipColor(company.status)}
          variant="outlined"
        />
      }
      actions={
        isPending && !credentials ? (
          <>
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
          </>
        ) : null
      }
      sections={[
        {
          title: t("companies.detailsTitle"),
          content: (
            <Stack spacing={2}>
              <DetailGrid>
                <DetailField label={t("companies.fieldName")} value={company.name} />
                <DetailField
                  label={t("companies.fieldApplicant")}
                  value={company.applicantName || company.joinApplication?.fullName}
                />
                <DetailField label={t("companies.col.phone")} value={company.phone} />
                <DetailField
                  label={t("companies.fieldEmail")}
                  value={company.email_public || company.joinApplication?.email}
                />
                <DetailField label={t("consultants.col.city")} value={company.city} />
                <DetailField label={t("companies.fieldProductsCount")} value={String(company.productsCount ?? 0)} />
                <DetailField label={t("companies.fieldProductLimit")} value={String(company.maxProducts ?? "-")} />
                <DetailField label={t("companies.fieldDisplayDays")} value={String(company.displayDays ?? 30)} />
                <DetailField
                  label={t("companies.fieldListingExpires")}
                  value={
                    company.listingExpiresAt
                      ? new Date(company.listingExpiresAt).toLocaleString(locale)
                      : "-"
                  }
                />
                <DetailField
                  label={t("companies.fieldRevenue")}
                  value={`${t("market.currency")} ${Number(company.revenue || 0).toLocaleString(locale)}`}
                />
                <DetailField
                  label={t("companies.fieldRating")}
                  value={Number(company.rating || 0).toFixed(1)}
                />
                <DetailField
                  label={t("companies.fieldBusinessLicense")}
                  value={
                    <AssetLink
                      path={company.businessLicense || company.joinApplication?.businessLicense}
                      label={t("companies.viewFile")}
                    />
                  }
                />
                <DetailField
                  label={t("companies.fieldCommercialReg")}
                  value={
                    <AssetLink
                      path={company.commercialReg || company.joinApplication?.commercialReg}
                      label={t("companies.viewFile")}
                    />
                  }
                />
              </DetailGrid>
              <DetailGrid columns={{ xs: 1, sm: 1, md: 1 }}>
                <DetailField
                  label={t("companies.fieldDescription")}
                  value={company.description || company.joinApplication?.description}
                />
              </DetailGrid>
            </Stack>
          ),
        },
        ...(isPending && !credentials
          ? [
              {
                title: t("companies.reviewTitle"),
                content: (
                  <Stack spacing={2} sx={{ maxWidth: 480 }}>
                    <TextField
                      label={t("companies.productQuota")}
                      type="number"
                      size="small"
                      fullWidth
                      slotProps={{ htmlInput: { min: 1 } }}
                      value={maxProducts}
                      onChange={(e) => setMaxProducts(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
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
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                    />
                    <TextField
                      label={t("companies.loginEmail")}
                      type="email"
                      size="small"
                      fullWidth
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                    />
                    <Stack direction="row" spacing={1}>
                      <TextField
                        label={t("companies.loginPassword")}
                        type="text"
                        size="small"
                        fullWidth
                        value={companyPassword}
                        onChange={(e) => setCompanyPassword(e.target.value)}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                      />
                      <Button
                        type="button"
                        variant="outlined"
                        onClick={() => setCompanyPassword(generatePassword())}
                        sx={{ borderRadius: "8px" }}
                      >
                        {t("companies.generatePassword")}
                      </Button>
                    </Stack>
                    <TextField
                      label={t("companies.adminNote")}
                      size="small"
                      fullWidth
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                    />
                    {formError ? <Alert severity="error">{formError}</Alert> : null}
                  </Stack>
                ),
              },
            ]
          : []),
        ...(credentials
          ? [
              {
                title: t("companies.accountCreated"),
                content: (
                  <Stack spacing={2}>
                    <DetailGrid columns={{ xs: 1, sm: 2, md: 2 }}>
                      <DetailField label={t("companies.fieldEmail")} value={credentials.email} />
                      <DetailField label={t("companies.loginPassword")} value={credentials.password} />
                    </DetailGrid>
                    <Typography variant="caption" color="text.secondary">
                      {t("companies.credentialsHint")}
                    </Typography>
                    <Button
                      variant="outlined"
                      sx={{ borderRadius: "8px", alignSelf: "flex-start" }}
                      onClick={() => navigate("/companies")}
                    >
                      {t("companies.close")}
                    </Button>
                  </Stack>
                ),
              },
            ]
          : []),
        ...(!isPending
          ? [
              {
                title: t("companies.setLimit"),
                content: (
                  <Stack spacing={2} sx={{ maxWidth: 420 }}>
                    <TextField
                      label={t("companies.assignLimit")}
                      type="number"
                      size="small"
                      fullWidth
                      slotProps={{ htmlInput: { min: 1 } }}
                      value={newLimit}
                      onChange={(e) => setNewLimit(Number(e.target.value))}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
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
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
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
                    <Box sx={{ pt: 1 }}>
                      <TextField
                        label={t("companies.fieldPartnerSortOrder")}
                        type="number"
                        size="small"
                        fullWidth
                        disabled={company.status !== "APPROVED"}
                        slotProps={{ htmlInput: { min: 0 } }}
                        value={editPartnerSortOrder}
                        onChange={(e) => setEditPartnerSortOrder(Number(e.target.value))}
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px" } }}
                      />
                      <Button
                        variant="outlined"
                        sx={{ mt: 1.5, borderRadius: "8px" }}
                        disabled={company.status !== "APPROVED" || partnerMutation.isPending}
                        onClick={() => partnerMutation.mutate(editPartnerSortOrder)}
                      >
                        {t("companies.savePartnerOrder")}
                      </Button>
                    </Box>
                  </Stack>
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
