import { useEffect, useRef } from "react";
import { AddPhotoAlternate, Close } from "@mui/icons-material";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { resolveAssetUrl } from "../../utils/asset-url";

export type CategoryImageState =
  | { kind: "none" }
  | { kind: "existing"; path: string }
  | { kind: "new"; file: File; preview: string };

type Props = {
  value: CategoryImageState;
  onChange: (value: CategoryImageState) => void;
  label: string;
  hint: string;
  addLabel: string;
  disabled?: boolean;
};

export function CategoryImagePicker({ value, onChange, label, hint, addLabel, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (value.kind === "new") URL.revokeObjectURL(value.preview);
    };
  }, [value]);

  function pickFile(fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    if (value.kind === "new") URL.revokeObjectURL(value.preview);
    onChange({ kind: "new", file, preview: URL.createObjectURL(file) });
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage() {
    if (value.kind === "new") URL.revokeObjectURL(value.preview);
    onChange({ kind: "none" });
  }

  const previewSrc =
    value.kind === "existing" ? resolveAssetUrl(value.path) : value.kind === "new" ? value.preview : "";

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
        {hint}
      </Typography>
      {previewSrc ? (
        <Box sx={{ position: "relative", display: "inline-block", mt: 1.5 }}>
          <Box
            component="img"
            src={previewSrc}
            alt=""
            sx={{
              width: 96,
              height: 96,
              objectFit: "cover",
              borderRadius: 1,
              border: 1,
              borderColor: "divider",
            }}
          />
          {!disabled ? (
            <IconButton
              size="small"
              aria-label="remove"
              onClick={removeImage}
              sx={{
                position: "absolute",
                top: -8,
                right: -8,
                bgcolor: "background.paper",
                boxShadow: 1,
                "&:hover": { bgcolor: "background.paper" },
              }}
            >
              <Close fontSize="small" />
            </IconButton>
          ) : null}
        </Box>
      ) : null}
      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
        <Button
          component="label"
          variant="outlined"
          size="small"
          startIcon={<AddPhotoAlternate />}
          disabled={disabled}
        >
          {previewSrc ? label : addLabel}
          <input ref={inputRef} type="file" hidden accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => pickFile(e.target.files)} />
        </Button>
      </Stack>
    </Box>
  );
}

export async function resolveCategoryImagePath(
  imageState: CategoryImageState,
  upload: (file: File) => Promise<string>
) {
  if (imageState.kind === "new") return upload(imageState.file);
  if (imageState.kind === "existing") return imageState.path;
  return null;
}
