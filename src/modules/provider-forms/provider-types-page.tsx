import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Button, Chip, CircularProgress, Paper, Stack, TextField, Typography } from "@mui/material";
import { Add } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { DataTable, EmptyState, PageHeader } from "../../components/layout";
import { AppDrawer } from "../../components/design-system";
import { PermissionGate } from "../../components/permission-gate";
import { toast } from "../../components/ui/sonner";
import { useI18n } from "../../hooks/use-i18n";
import {
  activateProviderType,
  archiveProviderType,
  completeCutoverApi,
  createProviderType,
  deactivateProviderType,
  fetchCutoverReadiness,
  fetchProviderTypes,
  revertCutoverApi,
  unarchiveProviderType,
  updateProviderType,
  type ProviderType,
} from "../../services/provider-forms-api";

type Row = ProviderType & Record<string, unknown>;
const emptyForm = { nameAr: "", nameEn: "", code: "", descriptionAr: "", descriptionEn: "" };

function statusColor(status: ProviderType["status"]): "success" | "default" | "warning" {
  if (status === "ACTIVE") return "success";
  if (status === "ARCHIVED") return "warning";
  return "default";
}

export function ProviderTypesPage() {
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProviderType | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const typesQuery = useQuery({ queryKey: ["provider-types"], queryFn: fetchProviderTypes });
  const readinessQuery = useQuery({ queryKey: ["provider-cutover"], queryFn: fetchCutoverReadiness });

  // COMPANY is fixed and has its own flow: it is never listed or editable here.
  const providerTypes = (typesQuery.data || []).filter((type) => type.managed && type.category === "PROVIDER");
  const name = (type: ProviderType) => (language === "ar" ? type.nameAr || type.nameEn : type.nameEn || type.nameAr);

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["provider-types"] });
    queryClient.invalidateQueries({ queryKey: ["provider-cutover"] });
    queryClient.invalidateQueries({ queryKey: ["provider-filter-types"] });
    queryClient.invalidateQueries({ queryKey: ["application-filter-types"] });
  };
  const onError = (err: unknown) => toast.error(err instanceof Error ? err.message : t("providerTypes.actionFailed"));

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        nameAr: form.nameAr.trim(),
        nameEn: form.nameEn.trim(),
        descriptionAr: form.descriptionAr.trim() || undefined,
        descriptionEn: form.descriptionEn.trim() || undefined,
      };
      return editing
        ? updateProviderType(editing.id, payload)
        : createProviderType({ ...payload, code: form.code.trim().toUpperCase() || undefined });
    },
    onSuccess: () => {
      refresh();
      toast.success(editing ? t("providerTypes.updated") : t("providerTypes.created"));
      setDrawerOpen(false);
    },
    onError: (err: unknown) => setFormError(err instanceof Error ? err.message : t("providerTypes.actionFailed")),
  });

  const actionMutation = useMutation({
    mutationFn: async ({ action, type }: { action: "activate" | "deactivate" | "archive" | "unarchive"; type: ProviderType }) => {
      const confirmKey = { activate: "", deactivate: "providerTypes.confirmDeactivate", archive: "providerTypes.confirmArchive", unarchive: "" }[action];
      if (confirmKey && !window.confirm(t(confirmKey))) return null;
      const fn = { activate: activateProviderType, deactivate: deactivateProviderType, archive: archiveProviderType, unarchive: unarchiveProviderType }[action];
      return fn(type.id);
    },
    onSuccess: (result) => {
      if (result) {
        refresh();
        toast.success(t("providerTypes.updated"));
      }
    },
    onError: onError,
  });

  const cutoverMutation = useMutation({
    mutationFn: async (action: "complete" | "revert") => {
      if (!window.confirm(t(action === "complete" ? "providerTypes.confirmCutover" : "providerTypes.confirmRevert"))) return null;
      return action === "complete" ? completeCutoverApi() : revertCutoverApi();
    },
    onSuccess: (result) => {
      if (result) {
        refresh();
        toast.success(t("providerTypes.cutoverUpdated"));
      }
    },
    onError: onError,
  });

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setFormError("");
    setDrawerOpen(true);
  }

  function openEdit(type: ProviderType) {
    setEditing(type);
    setForm({
      nameAr: type.nameAr,
      nameEn: type.nameEn,
      code: type.code,
      descriptionAr: type.descriptionAr || "",
      descriptionEn: type.descriptionEn || "",
    });
    setFormError("");
    setDrawerOpen(true);
  }

  if (typesQuery.isError) {
    return <EmptyState title={t("providerTypes.loadFailed")} description={(typesQuery.error as Error).message} />;
  }

  const readiness = readinessQuery.data;

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={t("providerTypes.title")}
        subtitle={t("providerTypes.subtitle")}
        action={
          <PermissionGate permission="provider_types.manage">
            <Button variant="contained" startIcon={<Add />} onClick={openCreate}>
              {t("providerTypes.add")}
            </Button>
          </PermissionGate>
        }
      />

      <Alert severity="info">{t("providerTypes.companyFixed")}</Alert>

      {readiness ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                {t("providerTypes.rollout")}
              </Typography>
              <Chip
                size="small"
                color={readiness.mode === "DYNAMIC" ? "success" : "warning"}
                label={t(readiness.mode === "DYNAMIC" ? "providerTypes.modeDynamic" : "providerTypes.modeLegacy")}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {t(readiness.mode === "DYNAMIC" ? "providerTypes.rolloutDynamicHint" : "providerTypes.rolloutLegacyHint")}
            </Typography>
            {readiness.mode === "LEGACY" && readiness.blockers.length ? (
              <Typography variant="body2">
                {t("providerTypes.blockers")}: {readiness.blockers.map((b) => (language === "ar" ? b.nameAr || b.nameEn : b.nameEn || b.nameAr)).join("، ")}
              </Typography>
            ) : null}
            <PermissionGate permission="provider_forms.publish">
              <Stack direction="row" spacing={1}>
                {readiness.mode === "LEGACY" ? (
                  <Button
                    variant="contained"
                    disabled={!readiness.ready || cutoverMutation.isPending}
                    onClick={() => cutoverMutation.mutate("complete")}
                  >
                    {t("providerTypes.completeCutover")}
                  </Button>
                ) : (
                  <Button variant="outlined" color="warning" disabled={cutoverMutation.isPending} onClick={() => cutoverMutation.mutate("revert")}>
                    {t("providerTypes.revertCutover")}
                  </Button>
                )}
              </Stack>
            </PermissionGate>
          </Stack>
        </Paper>
      ) : null}

      {typesQuery.isLoading ? (
        <Stack sx={{ py: 4, alignItems: "center" }}>
          <CircularProgress size={28} />
        </Stack>
      ) : (
        <DataTable<Row>
          loading={false}
          emptyMessage={t("providerTypes.empty")}
          getRowKey={(row) => row.id}
          data={providerTypes as Row[]}
          columns={[
            {
              key: "nameEn",
              label: t("providerTypes.col.name"),
              render: (row) => (
                <Stack>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {name(row)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {row.code}
                    {row.isSystem ? ` · ${t("providerTypes.system")}` : ""}
                  </Typography>
                </Stack>
              ),
            },
            {
              key: "status",
              label: t("providerTypes.col.status"),
              render: (row) => <Chip size="small" color={statusColor(row.status)} label={t(`providerTypes.status.${row.status}`)} />,
            },
            {
              key: "hasPublishedForm",
              label: t("providerTypes.col.form"),
              render: (row) =>
                row.hasPublishedForm ? (
                  <Chip size="small" color="success" variant="outlined" label={`v${row.publishedVersion}`} />
                ) : (
                  <Chip size="small" variant="outlined" label={t("providerTypes.noForm")} />
                ),
            },
            { key: "applicationsCount", label: t("providerTypes.col.applications") },
            {
              key: "id",
              label: t("providerTypes.col.actions"),
              render: (row) => (
                <Stack direction="row" spacing={0.5} useFlexGap sx={{ flexWrap: "wrap" }}>
                  <PermissionGate permission="provider_forms.view">
                    <Button size="small" onClick={() => navigate(`/provider-types/${row.id}/form`)}>
                      {t("providerTypes.form")}
                    </Button>
                  </PermissionGate>
                  <PermissionGate permission="provider_types.manage">
                    <Button size="small" onClick={() => openEdit(row)}>
                      {t("common.edit")}
                    </Button>
                    {row.status === "ARCHIVED" ? (
                      <Button size="small" onClick={() => actionMutation.mutate({ action: "unarchive", type: row })}>
                        {t("providerTypes.unarchive")}
                      </Button>
                    ) : (
                      <>
                        {row.isActive ? (
                          <Button size="small" onClick={() => actionMutation.mutate({ action: "deactivate", type: row })}>
                            {t("providerTypes.deactivate")}
                          </Button>
                        ) : (
                          <Button size="small" disabled={!row.hasPublishedForm} onClick={() => actionMutation.mutate({ action: "activate", type: row })}>
                            {t("providerTypes.activate")}
                          </Button>
                        )}
                        <Button size="small" color="warning" onClick={() => actionMutation.mutate({ action: "archive", type: row })}>
                          {t("providerTypes.archive")}
                        </Button>
                      </>
                    )}
                  </PermissionGate>
                </Stack>
              ),
            },
          ]}
        />
      )}

      <AppDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title={editing ? t("providerTypes.edit") : t("providerTypes.add")}
        width={480}
        footer={
          <Stack direction="row" spacing={1}>
            <Button
              variant="contained"
              disabled={form.nameAr.trim().length < 2 || form.nameEn.trim().length < 2 || saveMutation.isPending}
              onClick={() => {
                setFormError("");
                saveMutation.mutate();
              }}
            >
              {t("common.save")}
            </Button>
            <Button onClick={() => setDrawerOpen(false)}>{t("common.cancel")}</Button>
          </Stack>
        }
      >
        <Stack spacing={2}>
          {formError ? <Alert severity="error">{formError}</Alert> : null}
          <TextField size="small" fullWidth label={`${t("providerTypes.nameAr")} *`} value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} />
          <TextField size="small" fullWidth label={`${t("providerTypes.nameEn")} *`} value={form.nameEn} onChange={(e) => setForm((f) => ({ ...f, nameEn: e.target.value }))} />
          <TextField
            size="small"
            fullWidth
            label={t("providerTypes.code")}
            helperText={editing ? t("providerTypes.codeLocked") : t("providerTypes.codeHint")}
            disabled={Boolean(editing)}
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
          />
          <TextField size="small" fullWidth multiline minRows={2} label={t("providerTypes.descriptionAr")} value={form.descriptionAr} onChange={(e) => setForm((f) => ({ ...f, descriptionAr: e.target.value }))} />
          <TextField size="small" fullWidth multiline minRows={2} label={t("providerTypes.descriptionEn")} value={form.descriptionEn} onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))} />
        </Stack>
      </AppDrawer>
    </Stack>
  );
}
