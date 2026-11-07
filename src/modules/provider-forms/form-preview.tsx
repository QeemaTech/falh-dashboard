import { useState } from "react";
import { Checkbox, FormControl, FormControlLabel, FormGroup, FormLabel, MenuItem, Radio, RadioGroup, Stack, TextField, Typography } from "@mui/material";
import { useI18n } from "../../hooks/use-i18n";
import type { FormQuestion } from "../../services/provider-forms-api";
import { visibleQuestions } from "./form-logic";

type Props = {
  questions: FormQuestion[];
  /** Reports the sample answers so the parent can ask the backend to validate them. */
  onAnswersChange?: (answers: Record<string, unknown>) => void;
};

/** Renders a form the way an applicant would see it (inputs are local; nothing is submitted). */
export function FormPreview({ questions, onAnswersChange }: Props) {
  const { t, language } = useI18n();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const text = (ar?: string | null, en?: string | null) => (language === "ar" ? ar || en : en || ar) || "";

  const set = (key: string, value: unknown) => {
    const next = { ...answers, [key]: value };
    setAnswers(next);
    onAnswersChange?.(next);
  };

  return (
    <Stack spacing={2}>
      {visibleQuestions(questions, answers).map((q) => {
        const label = `${text(q.labelAr, q.labelEn)}${q.required ? " *" : ""}`;
        const help = text(q.helpAr, q.helpEn);
        const options = q.options.map((o) => ({ value: o.value, label: text(o.labelAr, o.labelEn) || o.value }));
        switch (q.fieldType) {
          case "TEXTAREA":
            return (
              <TextField key={q.key} size="small" fullWidth multiline minRows={3} label={label} helperText={help} value={(answers[q.key] as string) || ""} onChange={(e) => set(q.key, e.target.value)} />
            );
          case "NUMBER":
            return (
              <TextField key={q.key} size="small" fullWidth type="number" label={label} helperText={help} value={(answers[q.key] as string | number) ?? ""} onChange={(e) => set(q.key, e.target.value === "" ? undefined : Number(e.target.value))} />
            );
          case "DATE":
            return (
              <TextField key={q.key} size="small" fullWidth type="date" label={label} helperText={help} slotProps={{ inputLabel: { shrink: true } }} value={(answers[q.key] as string) || ""} onChange={(e) => set(q.key, e.target.value)} />
            );
          case "SELECT":
            return (
              <TextField key={q.key} select size="small" fullWidth label={label} helperText={help} value={(answers[q.key] as string) || ""} onChange={(e) => set(q.key, e.target.value)}>
                {options.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
            );
          case "RADIO":
            return (
              <FormControl key={q.key}>
                <FormLabel>{label}</FormLabel>
                <RadioGroup value={(answers[q.key] as string) || ""} onChange={(e) => set(q.key, e.target.value)}>
                  {options.map((o) => (
                    <FormControlLabel key={o.value} value={o.value} control={<Radio size="small" />} label={o.label} />
                  ))}
                </RadioGroup>
                {help ? <Typography variant="caption" color="text.secondary">{help}</Typography> : null}
              </FormControl>
            );
          case "MULTI_SELECT":
            return (
              <FormControl key={q.key}>
                <FormLabel>{label}</FormLabel>
                <FormGroup>
                  {options.map((o) => {
                    const current = (answers[q.key] as string[]) || [];
                    return (
                      <FormControlLabel
                        key={o.value}
                        label={o.label}
                        control={<Checkbox size="small" checked={current.includes(o.value)} onChange={(e) => set(q.key, e.target.checked ? [...current, o.value] : current.filter((v) => v !== o.value))} />}
                      />
                    );
                  })}
                </FormGroup>
                {help ? <Typography variant="caption" color="text.secondary">{help}</Typography> : null}
              </FormControl>
            );
          case "CHECKBOX":
            return <FormControlLabel key={q.key} label={label} control={<Checkbox size="small" checked={answers[q.key] === true} onChange={(e) => set(q.key, e.target.checked)} />} />;
          case "FILE":
            return (
              <Stack key={q.key} spacing={0.5}>
                <Typography variant="body2">{label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t("providerForms.previewFile").replace("{n}", String(q.validation.maxFiles ?? 1))}
                </Typography>
              </Stack>
            );
          default:
            return <TextField key={q.key} size="small" fullWidth label={label} helperText={help} value={(answers[q.key] as string) || ""} onChange={(e) => set(q.key, e.target.value)} />;
        }
      })}
    </Stack>
  );
}
