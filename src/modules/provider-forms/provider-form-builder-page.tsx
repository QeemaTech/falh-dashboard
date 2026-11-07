import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { Alert, Button, Chip, CircularProgress, Paper, Stack, Typography } from "@mui/material";
import { Add, ArrowDownward, ArrowUpward, Delete, Edit } from "@mui/icons-material";
import { IconButton } from "@mui/material";
import { DataTable, EmptyState, PageHeader } from "../../components/layout";
import { PermissionGate } from "../../components/permission-gate";
import { toast } from "../../components/ui/sonner";
import { useI18n } from "../../hooks/use-i18n";
import {
  addQuestionApi,
  createDraftForm,
  deleteQuestionApi,
  discardDraftForm,
  fetchFormVersion,
  fetchFormVersions,
  fetchProviderTypes,
  previewFormApi,
  publishFormApi,
  reorderQuestionsApi,
  updateQuestionApi,
  type FormPreview as PreviewResult,
  type FormQuestion,
} from "../../services/provider-forms-api";
import { FormPreview } from "./form-preview";
import { moveId, sortQuestions } from "./form-logic";
import { QuestionEditorDrawer } from "./question-editor-drawer";

type Row = FormQuestion & Record<string, unknown>;

function versionColor(status: string): "success" | "warning" | "default" {
  if (status === "PUBLISHED") return "success";
  if (status === "DRAFT") return "warning";
  return "default";
}

export function ProviderFormBuilderPage() {
  const { typeId } = useParams<{ typeId: string }>();
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<FormQuestion | null>(null);
  const [preview, setPreview] = useState<PreviewResult | null>(null);
  const [sampleAnswers, setSampleAnswers] = useState<Record<string, unknown>>({});

  const typesQuery = useQuery({ queryKey: ["provider-types"], queryFn: fetchProviderTypes });
  const versionsQuery = useQuery({
    queryKey: ["provider-form-versions", typeId],
    queryFn: () => fetchFormVersions(typeId!),
    enabled: Boolean(typeId),
  });

  const type = typesQuery.data?.find((x) => x.id === typeId);
  const versions = useMemo(() => versionsQuery.data ?? [], [versionsQuery.data]);
  const draft = versions.find((v) => v.status === "DRAFT");

  // Derived selection: the chosen version if it still exists, otherwise the draft being edited,
  // otherwise the published version, otherwise the latest one.
  const activeId =
    (selectedId && versions.some((v) => v.id === selectedId) ? selectedId : null) ??
    (draft || versions.find((v) => v.status === "PUBLISHED") || versions[0])?.id ??
    null;

  const versionQuery = useQuery({
    queryKey: ["provider-form-version", activeId],
    queryFn: () => fetchFormVersion(activeId!),
    enabled: Boolean(activeId),
  });

  const selected = versionQuery.data?.form;
  const questions = useMemo(() => sortQuestions(selected?.questions || []), [selected]);
  const editable = selected?.status === "DRAFT";

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["provider-form-versions", typeId] });
    queryClient.invalidateQueries({ queryKey: ["provider-form-version", activeId] });
    queryClient.invalidateQueries({ queryKey: ["provider-types"] });
    queryClient.invalidateQueries({ queryKey: ["provider-cutover"] });
    setPreview(null);
  };
  const onError = (err: unknown) => toast.error(err instanceof Error ? err.message : t("providerForms.saveFailed"));

  const createDraftMutation = useMutation({
    mutationFn: () => createDraftForm(typeId!, {}),
    onSuccess: (created) => {
      setSelectedId(created.id);
      refresh();
      toast.success(t("providerForms.draftCreated"));
    },
    onError,
  });

  const discardMutation = useMutation({
    mutationFn: async () => {
      if (!activeId || !window.confirm(t("providerForms.confirmDiscard"))) return null;
      return discardDraftForm(activeId);
    },
    onSuccess: (result) => {
      if (result) {
        setSelectedId(null);
        refresh();
      }
    },
    onError,
  });

  const saveQuestion = async (q: FormQuestion) => {
    // Never send sortOrder from the editor: new questions are appended by the server and order changes go through the reorder endpoint.
    const { sortOrder: _ignored, ...rest } = q;
    void _ignored;
    const payload = { ...rest, mapsTo: q.mapsTo || null };
    if (q.id) await updateQuestionApi(activeId!, q.id, payload);
    else await addQuestionApi(activeId!, payload);
    setEditorOpen(false);
    refresh();
    toast.success(t("providerForms.questionSaved"));
  };

  const deleteMutation = useMutation({
    mutationFn: async (q: FormQuestion) => {
      if (!window.confirm(t("providerForms.confirmDeleteQuestion"))) return null;
      return deleteQuestionApi(activeId!, q.id!);
    },
    onSuccess: (r) => r && refresh(),
    onError,
  });

  const moveMutation = useMutation({
    mutationFn: ({ id, direction }: { id: string; direction: -1 | 1 }) =>
      reorderQuestionsApi(activeId!, moveId(questions.map((q) => q.id!), id, direction)),
    onSuccess: refresh,
    onError,
  });

  const previewMutation = useMutation({
    mutationFn: () => previewFormApi(activeId!, Object.keys(sampleAnswers).length ? sampleAnswers : undefined),
    onSuccess: setPreview,
    onError,
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!window.confirm(t("providerForms.confirmPublish"))) return null;
      return publishFormApi(activeId!);
    },
    onSuccess: (r) => {
      if (r) {
        refresh();
        toast.success(t("providerForms.published"));
      }
    },
    onError,
  });

  const typeName = type ? (language === "ar" ? type.nameAr || type.nameEn : type.nameEn || type.nameAr) : "";

  if (typesQuery.isError || versionsQuery.isError) {
    return <EmptyState title={t("providerForms.loadFailed")} description={((typesQuery.error || versionsQuery.error) as Error).message} />;
  }
  if (typesQuery.isLoading || versionsQuery.isLoading) {
    return (
      <Stack sx={{ py: 6, alignItems: "center" }}>
        <CircularProgress />
      </Stack>
    );
  }
  if (type && !type.managed) {
    return <EmptyState title={t("providerTypes.companyFixed")} description="" />;
  }

  return (
    <Stack spacing={2.5}>
      <PageHeader
        title={`${t("providerForms.title")}: ${typeName}`}
        subtitle={t("providerForms.subtitle")}
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" onClick={() => navigate("/provider-types")}>
              {t("common.back")}
            </Button>
            <PermissionGate permission="provider_forms.manage">
              <Button variant="contained" startIcon={<Add />} disabled={Boolean(draft) || createDraftMutation.isPending} onClick={() => createDraftMutation.mutate()}>
                {t("providerForms.newDraft")}
              </Button>
            </PermissionGate>
          </Stack>
        }
      />

      {!versions.length ? <Alert severity="info">{t("providerForms.noVersions")}</Alert> : null}

      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap", alignItems: "center" }}>
          <Typography variant="subtitle2">{t("providerForms.versions")}</Typography>
          {versions.map((v) => (
            <Chip
              key={v.id}
              clickable
              color={versionColor(v.status)}
              variant={activeId === v.id ? "filled" : "outlined"}
              label={`v${v.version} · ${t(`providerForms.status.${v.status}`)} · ${v.applicationsCount} ${t("providerForms.applications")}`}
              onClick={() => {
                setSelectedId(v.id);
                setPreview(null);
              }}
            />
          ))}
        </Stack>
      </Paper>

      {selected ? (
        <>
          {!editable ? <Alert severity="info">{t("providerForms.readOnly")}</Alert> : null}
          <Stack direction="row" spacing={1} sx={{ justifyContent: "space-between", flexWrap: "wrap" }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {t("providerForms.questions")} (v{selected.version})
            </Typography>
            {editable ? (
              <PermissionGate permission="provider_forms.manage">
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    startIcon={<Add />}
                    variant="outlined"
                    onClick={() => {
                      setEditing(null);
                      setEditorOpen(true);
                    }}
                  >
                    {t("providerForms.addQuestion")}
                  </Button>
                  <Button size="small" color="error" onClick={() => discardMutation.mutate()}>
                    {t("providerForms.discard")}
                  </Button>
                </Stack>
              </PermissionGate>
            ) : null}
          </Stack>

          <DataTable<Row>
            loading={versionQuery.isLoading}
            emptyMessage={t("providerForms.emptyQuestions")}
            getRowKey={(row) => row.id || row.key}
            data={questions as Row[]}
            columns={[
              { key: "sortOrder", label: "#", render: (row) => questions.findIndex((q) => q.id === row.id) + 1 },
              {
                key: "labelEn",
                label: t("providerForms.col.question"),
                render: (row) => (
                  <Stack>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {language === "ar" ? row.labelAr || row.labelEn : row.labelEn || row.labelAr}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.key}
                    </Typography>
                  </Stack>
                ),
              },
              { key: "fieldType", label: t("providerForms.fieldType"), render: (row) => t(`providerForms.type.${row.fieldType}`) },
              { key: "required", label: t("providerForms.required"), render: (row) => (row.required ? t("providerForms.yes") : t("providerForms.no")) },
              {
                key: "mapsTo",
                label: t("providerForms.mapsTo"),
                render: (row) => (row.mapsTo ? t(`providerForms.target.${row.mapsTo}`) : "-"),
              },
              { key: "isPublic", label: t("providerForms.isPublicShort"), render: (row) => (row.isPublic ? t("providerForms.yes") : t("providerForms.no")) },
              {
                key: "id",
                label: t("providerTypes.col.actions"),
                render: (row) =>
                  editable ? (
                    <PermissionGate permission="provider_forms.manage">
                      <Stack direction="row">
                        <IconButton size="small" disabled={moveMutation.isPending} onClick={() => moveMutation.mutate({ id: row.id!, direction: -1 })}>
                          <ArrowUpward fontSize="small" />
                        </IconButton>
                        <IconButton size="small" disabled={moveMutation.isPending} onClick={() => moveMutation.mutate({ id: row.id!, direction: 1 })}>
                          <ArrowDownward fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditing(row);
                            setEditorOpen(true);
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => deleteMutation.mutate(row)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Stack>
                    </PermissionGate>
                  ) : null,
              },
            ]}
          />

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t("providerForms.preview")}
              </Typography>
              {questions.length ? <FormPreview questions={questions} onAnswersChange={setSampleAnswers} /> : <Typography variant="body2">{t("providerForms.emptyQuestions")}</Typography>}
              <Stack direction="row" spacing={1}>
                <Button variant="outlined" disabled={previewMutation.isPending || !questions.length} onClick={() => previewMutation.mutate()}>
                  {t("providerForms.validateSample")}
                </Button>
                {editable ? (
                  <PermissionGate permission="provider_forms.publish">
                    <Button variant="contained" disabled={publishMutation.isPending || !questions.length} onClick={() => publishMutation.mutate()}>
                      {t("providerForms.publish")}
                    </Button>
                  </PermissionGate>
                ) : null}
              </Stack>
              {preview ? (
                <Stack spacing={1}>
                  {preview.problems.length ? (
                    <Alert severity="warning">
                      <strong>{t("providerForms.problems")}</strong>
                      <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                        {preview.problems.map((p, i) => (
                          <li key={i}>
                            {p.field}: {p.message}
                          </li>
                        ))}
                      </ul>
                    </Alert>
                  ) : (
                    <Alert severity="success">{preview.publishable ? t("providerForms.readyToPublish") : t("providerForms.noProblems")}</Alert>
                  )}
                  {preview.sample ? (
                    preview.sample.valid ? (
                      <Alert severity="success">{t("providerForms.sampleValid")}</Alert>
                    ) : (
                      <Alert severity="error">
                        <strong>{t("providerForms.sampleInvalid")}</strong>
                        <ul style={{ margin: 0, paddingInlineStart: 18 }}>
                          {preview.sample.errors.map((p, i) => (
                            <li key={i}>
                              {p.field}: {p.message}
                            </li>
                          ))}
                        </ul>
                      </Alert>
                    )
                  ) : null}
                </Stack>
              ) : null}
            </Stack>
          </Paper>
        </>
      ) : null}

      <QuestionEditorDrawer open={editorOpen} question={editing} allQuestions={questions} onClose={() => setEditorOpen(false)} onSave={saveQuestion} />
    </Stack>
  );
}
