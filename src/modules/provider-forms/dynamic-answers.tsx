import type { ReactNode } from "react";
import { Stack, Typography } from "@mui/material";
import { DetailField, DetailGrid } from "../../components/layout";
import { useI18n } from "../../hooks/use-i18n";
import type { FormQuestion } from "../../services/provider-forms-api";
import { formatAnswerValue, orphanAnswerKeys, sortQuestions } from "./form-logic";

type Props = {
  questions: FormQuestion[];
  answers: Record<string, unknown>;
  /** How to render an uploaded file path (the host page owns asset URL handling). */
  renderFile: (path: string, index: number) => ReactNode;
  /** Only questions flagged public (used for non-admin views). */
  onlyPublic?: boolean;
};

/**
 * Shows stored answers with the exact question set (labels, options) of the form version
 * they were submitted with, so historical applications never change meaning.
 */
export function DynamicAnswers({ questions, answers, renderFile, onlyPublic = false }: Props) {
  const { language, t } = useI18n();
  const shown = sortQuestions(questions).filter((q) => (onlyPublic ? q.isPublic && q.fieldType !== "FILE" : true));
  const orphans = orphanAnswerKeys(questions, answers);

  return (
    <Stack spacing={1.5}>
      <DetailGrid>
        {shown.map((q) => {
          const formatted = formatAnswerValue(q, answers[q.key], language);
          return (
            <DetailField
              key={q.key}
              label={(language === "ar" ? q.labelAr || q.labelEn : q.labelEn || q.labelAr) || q.key}
              value={
                formatted.kind === "files" ? (
                  <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
                    {formatted.paths.map((path, index) => (
                      <span key={path}>{renderFile(path, index)}</span>
                    ))}
                  </Stack>
                ) : (
                  formatted.text
                )
              }
            />
          );
        })}
      </DetailGrid>
      {orphans.length ? (
        <Typography variant="caption" color="warning.main">
          {t("providerForms.orphanAnswers")}: {orphans.join(", ")}
        </Typography>
      ) : null}
    </Stack>
  );
}
