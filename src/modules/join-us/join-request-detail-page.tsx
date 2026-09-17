import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Button,
  Chip,
  CircularProgress,
  Link,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { DetailField, DetailGrid, DetailPageShell, EmptyState } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  approveJoinUsApplicationApi,
  fetchJoinUsApplicationById,
  fetchJoinApplicationTypes,
  rejectJoinUsApplicationApi,
  type JoinApplicationType,
} from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import { generatePassword } from "../../utils/generate-password";
import { prefillCompanyLoginEmail } from "../../utils/company-approval-email";
import { toast } from "../../components/ui/sonner";

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  return "error";
}

function AssetLink({ path, label }: { path?: string; label: string }) {
  if (!path) return <span>-</span>;
  return (
    <Link href={resolveAssetUrl(path)} target="_blank" rel="noreferrer">
      {label}
    </Link>
  );
}

export function JoinRequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const statusLabel = (value: string) =>
    t(`joinUs.status.${value}` as "joinUs.status.PENDING") || value;

  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey: ["join-us-application", id],
    queryFn: () => fetchJoinUsApplicationById(id!),
    enabled: Boolean(id),
  });

  const isCompanyReview = detail?.review.kind === "company";
  const reviewFields = detail?.review.fields || {};

  useEffect(() => {
    if (!detail || credentials) return;
    setCompanyPassword((prev) => prev || generatePassword());
    if (detail.applicationType === "COMPANY") {
      const suggested = prefillCompanyLoginEmail(detail.email, reviewFields.email as string | undefined);
      if (suggested) setCompanyEmail(suggested);
    }
  }, [detail, credentials, reviewFields.email]);

  const reviewMutation = useMutation({
    mutationFn: async (payload: { action: "APPROVE" | "REJECT" }) => {
      if (!id || !detail) throw new Error("No application selected");
      if (payload.action === "REJECT") {
        return rejectJoinUsApplicationApi(id, {
          adminNote: adminNote.trim() || undefined,
        });
      }
      return approveJoinUsApplicationApi(id, {
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
        toast.success(t("companies.approveSuccess"));
      } else {
        toast.success(
          variables.action === "APPROVE" ? t("companies.approveSuccess") : t("companies.rejectSuccess")
        );
        navigate("/join-requests");
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

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError || !detail) {
    return (
      <EmptyState title={t("joinUs.loadFailed")} description={(error as Error)?.message} />
    );
  }

  return (
    <DetailPageShell
      title={t("joinUs.reviewTitle")}
      subtitle={typeLabel(detail.applicationType)}
      backTo="/join-requests"
      status={
        <Chip
          label={statusLabel(detail.status)}
          color={statusChipColor(detail.status)}
          size="small"
          variant="outlined"
        />
      }
      actions={
        !credentials && detail.status === "PENDING" ? (
          <>
            <Button
              variant="contained"
              disabled={reviewMutation.isPending}
              onClick={handleApprove}
              sx={{ borderRadius: "8px" }}
            >
              {detail.applicationType === "COMPANY"
                ? t("joinUs.approveCompany")
                : t("joinUs.approveProvider")}
            </Button>
            <Button
              variant="outlined"
              color="error"
              disabled={reviewMutation.isPending}
              onClick={() => reviewMutation.mutate({ action: "REJECT" })}
              sx={{ borderRadius: "8px" }}
            >
              {t("joinUs.reject")}
            </Button>
          </>
        ) : null
      }
      sections={[
        {
          title: t("joinUs.reviewTitle"),
          content: (
            <Stack spacing={2.5}>
              <DetailGrid>
                <DetailField label={t("joinUs.fieldType")} value={typeLabel(detail.applicationType)} />
                <DetailField label={t("joinUs.fieldStatus")} value={statusLabel(detail.status)} />
                {isCompanyReview ? (
                  <>
                    <DetailField
                      label={t("joinUs.fieldCompanyName")}
                      value={String(reviewFields.companyName || detail.companyName || "-")}
                    />
                    <DetailField
                      label={t("joinUs.fieldApplicant")}
                      value={String(reviewFields.applicantName || detail.fullName)}
                    />
                    <DetailField
                      label={t("joinUs.fieldPhone")}
                      value={String(reviewFields.phone || detail.phone)}
                    />
                    <DetailField
                      label={t("joinUs.fieldEmail")}
                      value={String(reviewFields.email || detail.email || "-")}
                    />
                    <DetailField
                      label={t("joinUs.fieldCity")}
                      value={String(reviewFields.city || detail.city)}
                    />
                    <DetailField
                      label={t("joinUs.fieldDescription")}
                      value={String(reviewFields.description || detail.description || "-")}
                    />
                    <DetailField
                      label={t("companies.fieldBusinessLicense")}
                      value={
                        <AssetLink
                          path={String(reviewFields.businessLicense || detail.businessLicense || "")}
                          label={t("joinUs.viewFile")}
                        />
                      }
                    />
                    <DetailField
                      label={t("companies.fieldCommercialReg")}
                      value={
                        <AssetLink
                          path={String(reviewFields.commercialReg || detail.commercialReg || "")}
                          label={t("joinUs.viewFile")}
                        />
                      }
                    />
                  </>
                ) : (
                  <>
                    <DetailField
                      label={t("joinUs.fieldFullName")}
                      value={String(reviewFields.fullName || detail.fullName)}
                    />
                    <DetailField
                      label={t("joinUs.fieldCity")}
                      value={String(reviewFields.city || detail.city)}
                    />
                    <DetailField
                      label={t("joinUs.fieldWhatsapp")}
                      value={String(reviewFields.whatsapp || detail.whatsappNumber || "-")}
                    />
                    <DetailField
                      label={t("joinUs.fieldPhone")}
                      value={String(reviewFields.phone || detail.phone)}
                    />
                    <DetailField
                      label={t("joinUs.fieldBio")}
                      value={String(reviewFields.bio || detail.bio || "-")}
                    />
                    <DetailField
                      label={t("joinUs.fieldSpecializations")}
                      value={
                        Array.isArray(reviewFields.specializations)
                          ? (reviewFields.specializations as string[]).join(", ") || "-"
                          : (detail.specializations || []).join(", ") || "-"
                      }
                    />
                    <DetailField
                      label={t("joinUs.fieldExperience")}
                      value={`${String(reviewFields.experience ?? detail.yearsOfExperience ?? "-")} ${t("joinUs.years")}`}
                    />
                    {detail.otherTypeLabel ? (
                      <DetailField label={t("joinUs.fieldOtherType")} value={detail.otherTypeLabel} />
                    ) : null}
                    <DetailField
                      label={t("joinUs.fieldIdImage")}
                      value={
                        <AssetLink
                          path={String(reviewFields.idImage || detail.idImage || "")}
                          label={t("joinUs.viewFile")}
                        />
                      }
                    />
                    <DetailField
                      label={t("joinUs.fieldLicenseImage")}
                      value={
                        <AssetLink
                          path={String(reviewFields.licenseImage || detail.licenseImage || "")}
                          label={t("joinUs.viewFile")}
                        />
                      }
                    />
                  </>
                )}
              </DetailGrid>

              {isCompanyReview && detail.status === "PENDING" && !credentials ? (
                <Stack spacing={2} sx={{ maxWidth: 480 }}>
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
                    <Button
                      type="button"
                      variant="outlined"
                      onClick={() => setCompanyPassword(generatePassword())}
                      sx={{ borderRadius: "8px" }}
                    >
                      {t("companies.generatePassword")}
                    </Button>
                  </Stack>
                </Stack>
              ) : null}

              {detail.status === "PENDING" && !credentials ? (
                <TextField
                  label={t("companies.adminNote")}
                  size="small"
                  fullWidth
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  sx={{ maxWidth: 480 }}
                />
              ) : null}

              {credentials ? (
                <Paper variant="outlined" sx={{ p: 2, borderRadius: "8px", borderColor: "primary.light" }}>
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
                  <Button sx={{ mt: 1, borderRadius: "8px" }} onClick={() => navigate("/join-requests")}>
                    {t("companies.close")}
                  </Button>
                </Paper>
              ) : null}

              {formError ? <Alert severity="error">{formError}</Alert> : null}
            </Stack>
          ),
        },
      ]}
    />
  );
}
