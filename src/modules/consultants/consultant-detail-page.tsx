import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Chip, CircularProgress, Link, Stack } from "@mui/material";
import { DetailField, DetailGrid, DetailPageShell, EmptyState } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import { fetchServiceProviderById, type AdminServiceProvider } from "../../services/admin-api";
import { fetchProviderFilterTypes } from "../../services/provider-forms-api";
import { PrivateFileLink } from "../../components/private-file-link";
import { DynamicAnswers } from "../provider-forms/dynamic-answers";
import { buildTypeFilterOptions } from "../provider-forms/form-logic";

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

  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey: ["admin-consultant", id],
    queryFn: () => fetchServiceProviderById(id!),
    enabled: Boolean(id),
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
                <DetailField label={t("consultants.phone")} value={detail.contactNumber} />
                <DetailField
                  label={t("consultants.whatsapp")}
                  value={
                    detail.whatsappNumber ? (
                      detail.whatsappLink ? (
                        <Link href={detail.whatsappLink} target="_blank" rel="noreferrer">
                          {detail.whatsappNumber}
                        </Link>
                      ) : (
                        detail.whatsappNumber
                      )
                    ) : (
                      "—"
                    )
                  }
                />
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
