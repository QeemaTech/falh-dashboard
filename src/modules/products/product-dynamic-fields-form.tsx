import { useRef } from "react";
import { AttachFile } from "@mui/icons-material";
import {
  Box,
  Button,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { DynamicField } from "../../services/admin-api";
import { resolveAssetUrl } from "../../utils/asset-url";
import {
  dynamicFieldLabel,
  dynamicFieldPlaceholder,
  getDynamicFieldOptionItems,
  isOptionsInputMode,
  sortedDynamicFields,
  type DynamicFieldValuesMap,
} from "./product-dynamic-fields-utils";

type Props = {
  fields: DynamicField[];
  values: DynamicFieldValuesMap;
  onChange: (values: DynamicFieldValuesMap) => void;
  language: "ar" | "en";
  disabled?: boolean;
  onUploadFile?: (file: File) => Promise<string>;
  t: (key: string) => string;
};

function setFieldValue(
  values: DynamicFieldValuesMap,
  fieldId: string,
  patch: Partial<{ value: string; fileUrl?: string }>
): DynamicFieldValuesMap {
  return {
    ...values,
    [fieldId]: {
      value: patch.value ?? values[fieldId]?.value ?? "",
      fileUrl: patch.fileUrl !== undefined ? patch.fileUrl : values[fieldId]?.fileUrl,
    },
  };
}

function DynamicFieldInput({
  field,
  value,
  onChange,
  language,
  disabled,
  onUploadFile,
  t,
}: {
  field: DynamicField;
  value: { value: string; fileUrl?: string };
  onChange: (next: { value: string; fileUrl?: string }) => void;
  language: "ar" | "en";
  disabled?: boolean;
  onUploadFile?: (file: File) => Promise<string>;
  t: (key: string) => string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const label = dynamicFieldLabel(field, language);
  const requiredMark = field.isRequired ? " *" : "";

  if (field.fieldType === "BOOLEAN") {
    const checked = ["true", "1", "yes"].includes(String(value.value).toLowerCase());
    return (
      <FormControl fullWidth disabled={disabled}>
        <FormControlLabel
          control={
            <Switch
              checked={checked}
              onChange={(e) => onChange({ ...value, value: e.target.checked ? "true" : "false" })}
            />
          }
          label={`${label}${requiredMark}`}
        />
        {field.helpText ? <FormHelperText>{field.helpText}</FormHelperText> : null}
      </FormControl>
    );
  }

  if (field.fieldType === "TEXTAREA") {
    return (
      <TextField
        label={`${label}${requiredMark}`}
        placeholder={dynamicFieldPlaceholder(field, language)}
        helperText={field.helpText}
        size="small"
        fullWidth
        multiline
        minRows={3}
        disabled={disabled}
        value={value.value}
        onChange={(e) => onChange({ ...value, value: e.target.value })}
      />
    );
  }

  if (isOptionsInputMode(field) || field.fieldType === "SELECT" || field.fieldType === "RADIO") {
    const options = getDynamicFieldOptionItems(field, language);
    if (field.fieldType === "RADIO") {
      return (
        <FormControl fullWidth disabled={disabled}>
          <FormLabel sx={{ fontSize: 14, mb: 0.5 }}>
            {label}
            {requiredMark}
          </FormLabel>
          <RadioGroup value={value.value} onChange={(e) => onChange({ ...value, value: e.target.value })}>
            {options.map((option) => (
              <FormControlLabel
                key={option.value}
                value={option.value}
                control={<Radio size="small" />}
                label={option.label}
              />
            ))}
          </RadioGroup>
          {field.helpText ? <FormHelperText>{field.helpText}</FormHelperText> : null}
        </FormControl>
      );
    }

    return (
      <TextField
        select
        label={`${label}${requiredMark}`}
        helperText={field.helpText}
        size="small"
        fullWidth
        disabled={disabled}
        value={value.value}
        onChange={(e) => onChange({ ...value, value: e.target.value })}
      >
        <MenuItem value="">{t("products.form.selectOption")}</MenuItem>
        {options.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  if (field.fieldType === "FILE") {
    return (
      <FormControl fullWidth disabled={disabled}>
        <FormLabel sx={{ fontSize: 14, mb: 0.5 }}>
          {label}
          {requiredMark}
        </FormLabel>
        <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<AttachFile />}
            disabled={disabled || !onUploadFile}
            onClick={() => fileInputRef.current?.click()}
          >
            {t("products.form.chooseFile")}
          </Button>
          {value.fileUrl ? (
            <Button size="small" href={resolveAssetUrl(value.fileUrl)} target="_blank" rel="noreferrer">
              {t("products.form.viewFile")}
            </Button>
          ) : null}
          {value.fileUrl ? (
            <Button
              size="small"
              color="error"
              disabled={disabled}
              onClick={() => onChange({ value: "", fileUrl: undefined })}
            >
              {t("products.form.removeFile")}
            </Button>
          ) : null}
        </Stack>
        <input
          ref={fileInputRef}
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !onUploadFile) return;
            const path = await onUploadFile(file);
            onChange({ value: file.name, fileUrl: path });
            e.target.value = "";
          }}
        />
        {field.helpText ? <FormHelperText>{field.helpText}</FormHelperText> : null}
      </FormControl>
    );
  }

  const inputType =
    field.fieldType === "NUMBER" ? "number" : field.fieldType === "DATE" ? "date" : "text";

  return (
    <TextField
      type={inputType}
      label={`${label}${requiredMark}`}
      placeholder={dynamicFieldPlaceholder(field, language)}
      helperText={field.helpText}
      size="small"
      fullWidth
      disabled={disabled}
      value={value.value}
      onChange={(e) => onChange({ ...value, value: e.target.value })}
      slotProps={field.fieldType === "NUMBER" ? { htmlInput: { min: 0 } } : undefined}
    />
  );
}

export function ProductDynamicFieldsForm({
  fields,
  values,
  onChange,
  language,
  disabled,
  onUploadFile,
  t,
}: Props) {
  const activeFields = sortedDynamicFields(fields);
  if (!activeFields.length) return null;

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.5,
        borderRadius: "8px",
        bgcolor: (theme) => (theme.palette.mode === "dark" ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.015)"),
        borderColor: "divider",
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "text.primary" }}>
          {t("products.form.categoryFields")}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {language === "ar"
            ? "الحقول والمواصفات الخاصة بالقسم المختار"
            : "Specific fields and specifications for the selected category"}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {activeFields.map((field) => {
          const isWide =
            field.fieldType === "TEXTAREA" ||
            field.fieldType === "FILE" ||
            field.fieldType === "RADIO";

          return (
            <Box
              key={field.id}
              sx={{
                gridColumn: isWide ? { xs: "1", sm: "1 / -1" } : "span 1",
                minWidth: 0,
              }}
            >
              <DynamicFieldInput
                field={field}
                value={values[field.id] || { value: "" }}
                onChange={(next) => onChange(setFieldValue(values, field.id, next))}
                language={language}
                disabled={disabled}
                onUploadFile={onUploadFile}
                t={t}
              />
            </Box>
          );
        })}
      </Box>
    </Paper>
  );
}
