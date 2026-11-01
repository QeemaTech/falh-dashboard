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
import { CompanyCategorySelect } from "../companies/company-category-select";

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

function formatExperiencePeriod(period?: string, years?: number, lang = "ar"): string {
  if (period === "NO_EXPERIENCE") return lang === "ar" ? "بدون خبرة سابقة (مبتدئ)" : "No prior experience (Beginner)";
  if (period === "LESS_THAN_1_YEAR") return lang === "ar" ? "أقل من سنة" : "Less than 1 year";
  if (period === "FROM_1_TO_3_YEARS") return lang === "ar" ? "من 1 إلى 3 سنوات" : "1 to 3 years";
  if (period === "FROM_4_TO_7_YEARS") return lang === "ar" ? "من 4 إلى 7 سنوات" : "4 to 7 years";
  if (period === "MORE_THAN_7_YEARS") return lang === "ar" ? "أكثر من 7 سنوات" : "More than 7 years";
  if (years !== undefined && years !== null) return `${years} ${lang === "ar" ? "سنوات" : "years"}`;
  return "-";
}

function formatLicense(license?: string, lang = "ar"): string {
  if (license === "YES") return lang === "ar" ? "نعم، يوجد ترخيص سارٍ" : "Yes, valid license";
  if (license === "NO") return lang === "ar" ? "لا يوجد" : "No";
  if (license === "NOT_APPLICABLE") return lang === "ar" ? "المهنة لا تتطلب ترخيصاً" : "Not applicable";
  return license || "-";
}

function formatBoolean(val?: boolean | null, lang = "ar"): string {
  if (val === true) return lang === "ar" ? "نعم" : "Yes";
  if (val === false) return lang === "ar" ? "لا" : "No";
  return "-";
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
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
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
      const requested = Array.isArray(reviewFields.categoryIds)
        ? (reviewFields.categoryIds as string[])
        : [];
      if (requested.length) setCategoryIds(requested);
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
        categoryIds: detail.applicationType === "COMPANY" ? categoryIds : undefined,
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
      if (categoryIds.length < 1) {
        setFormError(t("companies.categoriesMin"));
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

  const showReviewForm = detail.status === "PENDING" && !credentials;

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
        showReviewForm ? (
          <>
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
          </>
        ) : null
      }
      sections={[
        {
          title: t("joinUs.reviewTitle"),
          content: (
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
                    label={t("joinUs.fieldSpecializations")}
                    value={
                      Array.isArray(reviewFields.specializations)
                        ? (reviewFields.specializations as string[]).join(", ") || "-"
                        : (detail.specializations || []).join(", ") || "-"
                    }
                  />
                  <DetailField
                    label={language === "ar" ? "مدة الخبرة" : "Experience Period"}
                    value={formatExperiencePeriod(
                      (reviewFields.experiencePeriod as string) || detail.experiencePeriod,
                      (reviewFields.experience as number) ?? detail.yearsOfExperience,
                      language
                    )}
                  />
                  <DetailField
                    label={language === "ar" ? "المؤهل الدراسي / الشهادات" : "Qualification / Certificate"}
                    value={
                      ((reviewFields.hasQualification as boolean | undefined) ?? detail.hasQualification)
                        ? String(reviewFields.qualificationName || detail.qualificationName || (language === "ar" ? "حاصل على مؤهل" : "Qualified"))
                        : ((reviewFields.hasQualification as boolean | undefined) ?? detail.hasQualification) === false
                          ? (language === "ar" ? "لا يوجد مؤهل" : "No qualification")
                          : "-"
                    }
                  />
                  <DetailField
                    label={language === "ar" ? "ترخيص مزاولة المهنة" : "Practice License"}
                    value={formatLicense(
                      (reviewFields.hasLicense as string) || detail.hasLicense,
                      language
                    )}
                  />
                  <DetailField
                    label={language === "ar" ? "سابقة أعمال / نماذج سابقة" : "Work Samples Available"}
                    value={formatBoolean(
                      (reviewFields.hasWorkSamples as boolean | undefined) ?? detail.hasWorkSamples,
                      language
                    )}
                  />
                  {((reviewFields.serviceCoverageAreas as string) || detail.serviceCoverageAreas) ? (
                    <DetailField
                      label={language === "ar" ? "نطاق التغطية الجغرافية" : "Coverage Areas"}
                      value={String(reviewFields.serviceCoverageAreas || detail.serviceCoverageAreas)}
                    />
                  ) : null}
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
          ),
        },
        {
          title: isCompanyReview ? t("joinUs.fieldDescription") : t("joinUs.fieldBio"),
          content: (
            <DetailGrid columns={{ xs: 1, sm: 1, md: 1 }}>
              <DetailField
                label={isCompanyReview ? t("joinUs.fieldDescription") : t("joinUs.fieldBio")}
                value={
                  isCompanyReview
                    ? String(reviewFields.description || detail.description || "-")
                    : String(reviewFields.bio || detail.bio || "-")
                }
              />
            </DetailGrid>
          ),
        },
        ...(!isCompanyReview && (
          detail.providesAtClientLocation !== undefined ||
          detail.hasOwnPremises !== undefined ||
          detail.providesRemoteService !== undefined
        )
          ? [
              {
                title: language === "ar" ? "طريقة تقديم الخدمة" : "Service Delivery Modes",
                content: (
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    <Chip
                      label={language === "ar" ? "بموقع العميل (مزرعة / حظيرة)" : "At Client Location"}
                      color={detail.providesAtClientLocation ? "success" : "default"}
                      variant={detail.providesAtClientLocation ? "filled" : "outlined"}
                    />
                    <Chip
                      label={language === "ar" ? "المقر الخاص (عيادة / مكتب / مشتل)" : "Own Premises"}
                      color={detail.hasOwnPremises ? "success" : "default"}
                      variant={detail.hasOwnPremises ? "filled" : "outlined"}
                    />
                    <Chip
                      label={language === "ar" ? "عن بُعد (استشارات هاتفية / أونلاين)" : "Remote / Online"}
                      color={detail.providesRemoteService ? "success" : "default"}
                      variant={detail.providesRemoteService ? "filled" : "outlined"}
                    />
                  </Stack>
                ),
              },
            ]
          : []),
        ...(!isCompanyReview && (
          (Array.isArray(detail.attachments) && detail.attachments.length > 0) ||
          (Array.isArray(reviewFields.attachments) && (reviewFields.attachments as string[]).length > 0)
        )
          ? [
              {
                title: language === "ar" ? "المرفقات ونماذج الأعمال والشهادات" : "Attachments & Documents",
                content: (
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    {(((reviewFields.attachments as string[]) || detail.attachments || []) as string[]).map((fileUrl, idx) => (
                      <Button
                        key={idx}
                        variant="outlined"
                        size="small"
                        component="a"
                        href={resolveAssetUrl(fileUrl)}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ borderRadius: "8px" }}
                      >
                        {language === "ar" ? `مستند / مرفق #${idx + 1}` : `Attachment #${idx + 1}`}
                      </Button>
                    ))}
                  </Stack>
                ),
              },
            ]
          : []),
        ...(isCompanyReview && showReviewForm
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
                    <CompanyCategorySelect value={categoryIds} onChange={setCategoryIds} />
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
                  </Stack>
                ),
              },
            ]
          : []),
        ...(showReviewForm
          ? [
              {
                title: t("companies.adminNote"),
                content: (
                  <Stack spacing={2} sx={{ maxWidth: 480 }}>
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
                      onClick={() => navigate("/join-requests")}
                    >
                      {t("companies.close")}
                    </Button>
                  </Stack>
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
