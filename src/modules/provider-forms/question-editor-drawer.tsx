import { useState } from "react";
import { Alert, Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { Add, Delete } from "@mui/icons-material";
import { AppDrawer } from "../../components/design-system";
import { useI18n } from "../../hooks/use-i18n";
import { ApiValidationError, type FormFieldType, type FormQuestion, type MappingTarget } from "../../services/provider-forms-api";
import {
  FIELD_TYPES,
  OPTION_FIELD_TYPES,
  emptyQuestion,
  mappingChoices,
  sortQuestions,
  suggestKey,
  validateQuestionDraft,
} from "./form-logic";

type Props = {
  open: boolean;
  question: FormQuestion | null; // null = new question
  allQuestions: FormQuestion[];
  onClose: () => void;
  onSave: (question: FormQuestion) => Promise<void>;
};

/** Mounts a fresh editor (fresh state) every time it is opened for a question or for "new". */
export function QuestionEditorDrawer(props: Props) {
  if (!props.open) return null;
  return <QuestionEditorForm key={props.question?.id ?? "new"} {...props} />;
}

function QuestionEditorForm({ open, question, allQuestions, onClose, onSave }: Props) {
  const { t, isArabic } = useI18n();
  const isNew = !question?.id;
  const [draft, setDraft] = useState<FormQuestion>(() =>
    question ? { ...question, options: [...question.options] } : emptyQuestion()
  );
  const [keyTouched, setKeyTouched] = useState(Boolean(question));
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const others = allQuestions.filter((q) => q.id !== question?.id);
  const errors = validateQuestionDraft(draft, others.map((q) => q.key), isNew);
  const usedTargets = others.map((q) => q.mapsTo).filter(Boolean) as MappingTarget[];
  const choices = mappingChoices(draft.fieldType, usedTargets);
  const dependencyCandidates = sortQuestions(others).filter(
    (q) => (OPTION_FIELD_TYPES.includes(q.fieldType) && q.fieldType !== "MULTI_SELECT") || q.fieldType === "CHECKBOX"
  );
  const dependency = dependencyCandidates.find((q) => q.key === draft.visibleWhen?.questionKey);

  const set = (patch: Partial<FormQuestion>) => setDraft((d) => ({ ...d, ...patch }));
  const setValidation = (patch: Partial<FormQuestion["validation"]>) =>
    setDraft((d) => {
      const next = { ...d.validation, ...patch };
      (Object.keys(next) as (keyof typeof next)[]).forEach((k) => {
        if (next[k] === undefined || (next[k] as unknown) === "") delete next[k];
      });
      return { ...d, validation: next };
    });
  const num = (value: string) => (value.trim() === "" ? undefined : Number(value));

  const err = (field: string) => {
    const code = errors[field];
    const server = serverErrors[field];
    if (server) return server;
    return code ? t(`providerForms.err.${code}`) : undefined;
  };

  async function submit() {
    setSaving(true);
    setGeneralError("");
    setServerErrors({});
    try {
      await onSave(draft);
    } catch (e) {
      if (e instanceof ApiValidationError) {
        const map: Record<string, string> = {};
        e.fields.forEach((f) => {
          const top = f.field.split(/[.[]/)[0];
          map[top] = f.message;
        });
        setServerErrors(map);
        setGeneralError(e.message);
      } else setGeneralError(e instanceof Error ? e.message : t("providerForms.saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppDrawer
      open={open}
      onClose={onClose}
      title={isNew ? t("providerForms.addQuestion") : t("providerForms.editQuestion")}
      width={560}
      footer={
        <Stack direction="row" spacing={1}>
          <Button variant="contained" disabled={saving || Object.keys(errors).length > 0} onClick={submit}>
            {t("common.save")}
          </Button>
          <Button onClick={onClose}>{t("common.cancel")}</Button>
        </Stack>
      }
    >
      <Stack spacing={2} sx={{ pb: 5 }}>
        {generalError ? <Alert severity="error">{generalError}</Alert> : null}

        <TextField size="small" fullWidth label={`${t("providerForms.labelAr")} *`} value={draft.labelAr} error={Boolean(err("labelAr"))} helperText={err("labelAr")} onChange={(e) => set({ labelAr: e.target.value })} />
        <TextField
          size="small"
          fullWidth
          label={`${t("providerForms.labelEn")} *`}
          value={draft.labelEn}
          error={Boolean(err("labelEn"))}
          helperText={err("labelEn")}
          onChange={(e) => {
            const labelEn = e.target.value;
            set({ labelEn, ...(keyTouched || !isNew ? {} : { key: suggestKey(labelEn) }) });
          }}
        />
        <TextField
          size="small"
          fullWidth
          label={`${t("providerForms.key")} *`}
          value={draft.key}
          error={Boolean(err("key"))}
          helperText={err("key") || t("providerForms.keyHint")}
          onChange={(e) => {
            setKeyTouched(true);
            set({ key: e.target.value });
          }}
        />
        <TextField size="small" fullWidth multiline minRows={2} label={t("providerForms.helpAr")} value={draft.helpAr || ""} onChange={(e) => set({ helpAr: e.target.value })} />
        <TextField size="small" fullWidth multiline minRows={2} label={t("providerForms.helpEn")} value={draft.helpEn || ""} onChange={(e) => set({ helpEn: e.target.value })} />

        <TextField
          select
          size="small"
          fullWidth
          label={t("providerForms.fieldType")}
          value={draft.fieldType}
          onChange={(e) => {
            const fieldType = e.target.value as FormFieldType;
            set({ fieldType, mapsTo: null, validation: {}, options: OPTION_FIELD_TYPES.includes(fieldType) ? draft.options : [], isPublic: fieldType === "FILE" ? false : draft.isPublic });
          }}
        >
          {FIELD_TYPES.map((ft) => (
            <MenuItem key={ft} value={ft}>
              {t(`providerForms.type.${ft}`)}
            </MenuItem>
          ))}
        </TextField>

        <FormControlLabel control={<Checkbox checked={draft.required} onChange={(e) => set({ required: e.target.checked })} />} label={t("providerForms.required")} />

        {OPTION_FIELD_TYPES.includes(draft.fieldType) ? (
          <Stack spacing={1}>
            <Typography variant="subtitle2">{t("providerForms.options")}</Typography>
            {draft.options.map((option, index) => (
              <Stack key={index} direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <TextField size="small" label={t("providerForms.optionValue")} value={option.value} sx={{ width: 130 }} onChange={(e) => set({ options: draft.options.map((o, i) => (i === index ? { ...o, value: e.target.value } : o)) })} />
                <TextField size="small" label={t("providerForms.labelAr")} value={option.labelAr} sx={{ flex: 1 }} onChange={(e) => set({ options: draft.options.map((o, i) => (i === index ? { ...o, labelAr: e.target.value } : o)) })} />
                <TextField size="small" label={t("providerForms.labelEn")} value={option.labelEn} sx={{ flex: 1 }} onChange={(e) => set({ options: draft.options.map((o, i) => (i === index ? { ...o, labelEn: e.target.value } : o)) })} />
                <IconButton size="small" color="error" onClick={() => set({ options: draft.options.filter((_, i) => i !== index) })}>
                  <Delete fontSize="small" />
                </IconButton>
              </Stack>
            ))}
            {err("options") ? <Alert severity="warning">{err("options")}</Alert> : null}
            <Button size="small" startIcon={<Add />} onClick={() => set({ options: [...draft.options, { value: "", labelAr: "", labelEn: "" }] })}>
              {t("providerForms.addOption")}
            </Button>
          </Stack>
        ) : null}

        {draft.fieldType === "TEXT" || draft.fieldType === "TEXTAREA" ? (
          <Stack direction="row" spacing={1}>
            <TextField size="small" type="number" label={t("providerForms.minLength")} value={draft.validation.minLength ?? ""} onChange={(e) => setValidation({ minLength: num(e.target.value) })} />
            <TextField size="small" type="number" label={t("providerForms.maxLength")} value={draft.validation.maxLength ?? ""} onChange={(e) => setValidation({ maxLength: num(e.target.value) })} />
          </Stack>
        ) : null}
        {draft.fieldType === "NUMBER" ? (
          <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
            <TextField size="small" type="number" label={t("providerForms.min")} value={draft.validation.min ?? ""} onChange={(e) => setValidation({ min: num(e.target.value) })} />
            <TextField size="small" type="number" label={t("providerForms.max")} value={draft.validation.max ?? ""} onChange={(e) => setValidation({ max: num(e.target.value) })} />
            <FormControlLabel control={<Checkbox checked={Boolean(draft.validation.integerOnly)} onChange={(e) => setValidation({ integerOnly: e.target.checked || undefined })} />} label={t("providerForms.integerOnly")} />
          </Stack>
        ) : null}
        {draft.fieldType === "MULTI_SELECT" ? (
          <Stack direction="row" spacing={1}>
            <TextField size="small" type="number" label={t("providerForms.minSelections")} value={draft.validation.minSelections ?? ""} onChange={(e) => setValidation({ minSelections: num(e.target.value) })} />
            <TextField size="small" type="number" label={t("providerForms.maxSelections")} value={draft.validation.maxSelections ?? ""} onChange={(e) => setValidation({ maxSelections: num(e.target.value) })} />
          </Stack>
        ) : null}
        {draft.fieldType === "FILE" ? (
          <TextField size="small" type="number" label={t("providerForms.maxFiles")} helperText={t("providerForms.fileTypesHint")} value={draft.validation.maxFiles ?? ""} onChange={(e) => setValidation({ maxFiles: num(e.target.value) })} />
        ) : null}
        {err("validation") ? <Alert severity="warning">{err("validation")}</Alert> : null}

        <TextField
          select
          size="small"
          fullWidth
          label={t("providerForms.mapsTo")}
          helperText={err("mapsTo") || t("providerForms.mapsToHint")}
          error={Boolean(err("mapsTo"))}
          value={draft.mapsTo || ""}
          slotProps={{
            select: {
              displayEmpty: true,
              renderValue: (selected: unknown) => {
                const val = String(selected || "");
                if (!val) return t("providerForms.mapsToNone");
                return t(`providerForms.target.${val}`, val);
              },
            },
          }}
          onChange={(e) => set({ mapsTo: (e.target.value || null) as MappingTarget | null })}
        >
          <MenuItem value="">{t("providerForms.mapsToNone")}</MenuItem>
          {choices.map((target) => (
            <MenuItem key={target} value={target}>
              {t(`providerForms.target.${target}`)}
            </MenuItem>
          ))}
          {draft.mapsTo && !choices.includes(draft.mapsTo) ? (
            <MenuItem value={draft.mapsTo}>{t(`providerForms.target.${draft.mapsTo}`)}</MenuItem>
          ) : null}
        </TextField>

        <FormControlLabel
          control={<Checkbox checked={draft.isPublic} disabled={draft.fieldType === "FILE"} onChange={(e) => set({ isPublic: e.target.checked })} />}
          label={t("providerForms.isPublic")}
        />

        <Box
          sx={{
            p: 2,
            borderRadius: 1.5,
            border: 1,
            borderColor: "divider",
            backgroundColor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.03)" : "rgba(0, 0, 0, 0.015)",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>
            {t("providerForms.visibleWhen")}
          </Typography>
          <Stack spacing={1.5}>
            <TextField
              select
              size="small"
              fullWidth
              label={t("providerForms.dependsOn")}
              value={draft.visibleWhen?.questionKey || ""}
              slotProps={{
                select: {
                  displayEmpty: true,
                  renderValue: (selected: unknown) => {
                    const val = String(selected || "");
                    if (!val) return t("providerForms.always");
                    const found = dependencyCandidates.find((q) => q.key === val);
                    if (found) {
                      return (isArabic ? found.labelAr || found.labelEn : found.labelEn || found.labelAr) || found.key;
                    }
                    return val;
                  },
                },
              }}
              helperText={
                dependencyCandidates.length === 0
                  ? isArabic
                    ? "يظهر هذا السؤال دائمًا (لا توجد أسئلة سابقة ذات خيارات للاعتماد عليها)"
                    : "This question always appears (no preceding multiple-choice questions to depend on)"
                  : undefined
              }
              onChange={(e) => {
                const key = e.target.value;
                set({ visibleWhen: key ? { questionKey: key, operator: "equals", value: "" } : null });
              }}
            >
              <MenuItem value="">{t("providerForms.always")}</MenuItem>
              {dependencyCandidates.map((q) => {
                const label = (isArabic ? q.labelAr || q.labelEn : q.labelEn || q.labelAr) || q.key;
                return (
                  <MenuItem key={q.key} value={q.key}>
                    {label}
                  </MenuItem>
                );
              })}
            </TextField>

            {draft.visibleWhen && dependency ? (
              <TextField
                select
                size="small"
                fullWidth
                slotProps={{ select: { displayEmpty: true } }}
                label={t("providerForms.whenAnswerIs")}
                value={String(draft.visibleWhen.value ?? "")}
                onChange={(e) =>
                  set({
                    visibleWhen: {
                      ...draft.visibleWhen!,
                      operator: "equals",
                      value: dependency.fieldType === "CHECKBOX" ? e.target.value === "true" : e.target.value,
                    },
                  })
                }
              >
                {dependency.fieldType === "CHECKBOX"
                  ? [
                      <MenuItem key="t" value="true">
                        {t("providerForms.checked")}
                      </MenuItem>,
                      <MenuItem key="f" value="false">
                        {t("providerForms.unchecked")}
                      </MenuItem>,
                    ]
                  : dependency.options.map((o) => {
                      const optLabel = (isArabic ? o.labelAr || o.labelEn : o.labelEn || o.labelAr) || o.value;
                      return (
                        <MenuItem key={o.value} value={o.value}>
                          {optLabel}
                        </MenuItem>
                      );
                    })}
              </TextField>
            ) : null}
          </Stack>
        </Box>
      </Stack>
    </AppDrawer>
  );
}
