import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import {
  Box,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Link,
  Stack,
  Typography,
} from "@mui/material";
import { DetailField, DetailGrid, DetailPageShell, EmptyState } from "../../components/layout";
import { toast } from "../../components/ui/sonner";
import { useI18n } from "../../hooks/use-i18n";
import { usePermission } from "../../store/permission-context";
import {
  fetchServiceProviderById,
  setServiceProviderShowContactApi,
  type AdminServiceProvider,
} from "../../services/admin-api";
import { fetchProviderFilterTypes } from "../../services/provider-forms-api";
import { PrivateFileLink } from "../../components/private-file-link";
import { DynamicAnswers } from "../provider-forms/dynamic-answers";
import { buildTypeFilterOptions } from "../provider-forms/form-logic";
import { getApiErrorMessage } from "../../utils/api-error";

function providerName(provider: AdminServiceProvider) {
  return provider.name || provider.displayName || provider.user?.name || "-";
}

function statusChipColor(status: string): "success" | "warning" | "error" | "default" {
  if (status === "APPROVED") return "success";
  if (status === "PENDING") return "warning";
  if (status === "REJECTED" || status === "SUSPENDED") return "error";
  return "default";
}

export function ConsultantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t, language } = useI18n();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canToggleContact = hasPermission(["provider_listings.update", "consultants.update"]);

  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey: ["admin-consultant", id],
    queryFn: () => fetchServiceProviderById(id!),
    enabled: Boolean(id),
  });

  const showContactMutation = useMutation({
    mutationFn: (showContact: boolean) => setServiceProviderShowContactApi(id!, showContact),
    onSuccess: (updated) => {
      queryClient.setQueryData(["admin-consultant", id], updated);
      queryClient.invalidateQueries({ queryKey: ["admin-consultants"] });
      toast.success(t("consultants.contactUpdated"));
    },
    onError: (err: unknown) => toast.error(getApiErrorMessage(err, t("consultants.loadFailed"))),
  });

  const { data: filterTypes = [] } = useQuery({
    queryKey: ["provider-filter-types"],
    queryFn: fetchProviderFilterTypes,
  });
  const options = useMemo(() => buildTypeFilterOptions(filterTypes, language), [filterTypes, language]);

  // The referential type is authoritative; the legacy `type` enum is only a fallback for unlinked legacy rows.
  const resolveTypeKey = (provider: AdminServiceProvider) =>
    provider.providerType?.code || provider.applicationType || provider.type;

  const typeLabel = (typeKey: string, otherTypeLabel?: string | null) => {
    const fromType = detail?.providerType;
    if (fromType && fromType.code === typeKey) {
      return (language === "ar" ? fromType.nameAr || fromType.nameEn : fromType.nameEn || fromType.nameAr) || typeKey;
    }
    const option = options.find((o) => o.code === typeKey);
    if (option) return option.label;
    if (typeKey === "OTHER" && otherTypeLabel) return otherTypeLabel;
    return t(`consultants.type.${typeKey}`, typeKey);
  };

  const statusLabel = (status: string) => t(`consultants.status.${status}`, status);

  if (isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  if (isError || !detail) {
    return (
      <EmptyState title={t("consultants.loadFailed")} description={(error as Error)?.message} />
    );
  }

  return (
    <DetailPageShell
      title={providerName(detail)}
      subtitle={typeLabel(resolveTypeKey(detail), detail.otherTypeLabel)}
      backTo="/consultants"
      status={
        <Chip
          label={statusLabel(detail.status)}
          color={statusChipColor(detail.status)}
          size="small"
          variant="outlined"
        />
      }
      sections={[
        {
          title: t("consultants.detailsTitle"),
          content: (
            <Stack spacing={2}>
              <DetailGrid>
                <DetailField
                  label={t("consultants.col.type")}
                  value={typeLabel(resolveTypeKey(detail), detail.otherTypeLabel)}
                />
                <DetailField label={t("consultants.col.city")} value={detail.city} />
                <DetailField
                  label={t("consultants.col.rating")}
                  value={Number(detail.rating || 0).toFixed(1)}
                />
                <Box
                  sx={{
                    gridColumn: { xs: "span 1", sm: "span 2" },
                    border: 1,
                    borderColor: "divider",
                    borderRadius: "8px",
                    px: 1.5,
                    py: 1.25,
                    bgcolor: "background.paper",
                  }}
                >
                  <FormControlLabel
                    sx={{ alignItems: "flex-start", ml: 0, mb: 1 }}
                    control={
                      <Checkbox
                        size="small"
                        checked={detail.showContact !== false}
                        disabled={!canToggleContact || showContactMutation.isPending}
                        onChange={(e) => showContactMutation.mutate(e.target.checked)}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {t("consultants.showContact")}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t("consultants.showContactHint")}
                        </Typography>
                      </Box>
                    }
                  />
                  <Stack spacing={1.25} sx={{ pl: 4.5 }}>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase" }}
                      >
                        {t("consultants.phone")}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {detail.contactNumber || "—"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ display: "block", fontWeight: 700, fontSize: "0.65rem", textTransform: "uppercase" }}
                      >
                        {t("consultants.whatsapp")}
                      </Typography>
                      {detail.whatsappNumber ? (
                        detail.whatsappLink ? (
                          <Link href={detail.whatsappLink} target="_blank" rel="noreferrer" variant="body2" sx={{ fontWeight: 500 }}>
                            {detail.whatsappNumber}
                          </Link>
                        ) : (
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {detail.whatsappNumber}
                          </Typography>
                        )
                      ) : (
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          —
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>
                {detail.yearsOfExperience != null ? (
                  <DetailField
                    label={t("consultants.experience")}
                    value={`${detail.yearsOfExperience} ${t("consultants.years")}`}
                  />
                ) : null}
              </DetailGrid>
              <DetailGrid columns={{ xs: 1, sm: 1, md: 1 }}>
                <DetailField label={t("consultants.bio")} value={detail.bio || "—"} />
              </DetailGrid>
              {detail.specializations?.length ? (
                <DetailGrid columns={{ xs: 1, sm: 1, md: 1 }}>
                  <DetailField
                    label={t("consultants.specializations")}
                    value={
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5 }}>
                        {detail.specializations.map((item) => (
                          <Chip key={item} label={item} size="small" variant="outlined" />
                        ))}
                      </Stack>
                    }
                  />
                </DetailGrid>
              ) : null}
            </Stack>
          ),
        },
        ...(detail.dynamicAnswers?.items.length
          ? [
              {
                title: `${t("providerForms.answers")} · ${t("providerForms.formVersion")} v${detail.dynamicAnswers.formVersion}`,
                content: (
                  <DynamicAnswers
                    questions={detail.dynamicAnswers.items.map((item, index) => ({
                      key: item.key,
                      labelAr: item.labelAr,
                      labelEn: item.labelEn,
                      fieldType: item.fieldType as never,
                      required: false,
                      sortOrder: index,
                      options: item.options,
                      validation: {},
                      visibleWhen: null,
                      mapsTo: null,
                      isPublic: false,
                    }))}
                    answers={Object.fromEntries(detail.dynamicAnswers.items.map((item) => [item.key, item.value]))}
                    renderFile={(path) => <PrivateFileLink path={path} label={t("joinUs.viewFile")} />}
                  />
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
