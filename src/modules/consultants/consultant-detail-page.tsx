import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Box, Chip, CircularProgress, Link, Stack, Typography } from "@mui/material";
import { DetailField, DetailGrid, DetailPageShell, EmptyState } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import {
  fetchJoinApplicationTypes,
  fetchServiceProviderById,
  type AdminServiceProvider,
  type JoinApplicationType,
} from "../../services/admin-api";

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

  const { data: joinTypes = [] } = useQuery({
    queryKey: ["join-application-types"],
    queryFn: fetchJoinApplicationTypes,
  });

  const typesByCode = useMemo(() => {
    const map = new Map<string, JoinApplicationType>();
    joinTypes.forEach((type) => map.set(type.code, type));
    return map;
  }, [joinTypes]);

  const resolveTypeKey = (provider: AdminServiceProvider) =>
    provider.applicationType || provider.type;

  const typeLabel = (typeKey: string, otherTypeLabel?: string | null) => {
    const row = typesByCode.get(typeKey);
    if (row) {
      return language === "ar" ? row.nameAr || row.nameEn : row.nameEn || row.nameAr;
    }
    if (typeKey === "OTHER" && otherTypeLabel) return otherTypeLabel;
    return t(`consultants.type.${typeKey}`, typeKey);
  };

  const { data: detail, isLoading, isError, error } = useQuery({
    queryKey: ["admin-consultant", id],
    queryFn: () => fetchServiceProviderById(id!),
    enabled: Boolean(id),
  });

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
            <Stack spacing={2.5}>
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
              <DetailField label={t("consultants.bio")} value={detail.bio || "—"} />
              {detail.specializations?.length ? (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                    {t("consultants.specializations")}
                  </Typography>
                  <Stack direction="row" spacing={0.5} sx={{ flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
                    {detail.specializations.map((item) => (
                      <Chip key={item} label={item} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              ) : null}
            </Stack>
          ),
        },
      ]}
    />
  );
}
