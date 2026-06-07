import { useEffect, useRef } from "react";
import { AddPhotoAlternate, Close } from "@mui/icons-material";
import { Box, Button, IconButton, Stack, Typography } from "@mui/material";
import { resolveAssetUrl } from "../../utils/asset-url";
import type { AdminProduct } from "../../services/admin-api";

export type ProductImageItem =
  | { kind: "existing"; path: string; id?: string }
  | { kind: "new"; file: File; preview: string };

type Props = {
  items: ProductImageItem[];
  onChange: (items: ProductImageItem[]) => void;
  label: string;
  hint: string;
  addLabel: string;
  disabled?: boolean;
};

function itemKey(item: ProductImageItem, index: number) {
  if (item.kind === "existing") return `existing-${item.id || item.path}-${index}`;
  return `new-${item.file.name}-${item.file.size}-${index}`;
}

export function ProductImagePicker({ items, onChange, label, hint, addLabel, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    return () => {
      itemsRef.current.forEach((item) => {
        if (item.kind === "new") URL.revokeObjectURL(item.preview);
      });
    };
  }, []);

  function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    const next = [...items];
    for (const file of Array.from(fileList)) {
      if (!file.type.startsWith("image/")) continue;
      next.push({ kind: "new", file, preview: URL.createObjectURL(file) });
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeAt(index: number) {
    const item = items[index];
    if (item?.kind === "new") URL.revokeObjectURL(item.preview);
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
        {label}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
        {hint}
      </Typography>
      {items.length ? (
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", mt: 1.5, mb: 1.5 }}>
          {items.map((item, index) => (
            <Box
              key={itemKey(item, index)}
              sx={{
                position: "relative",
                width: 72,
                height: 72,
                borderRadius: 1,
                overflow: "hidden",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Box
                component="img"
                src={item.kind === "existing" ? resolveAssetUrl(item.path) : item.preview}
                alt=""
                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
              <IconButton
                size="small"
                disabled={disabled}
                onClick={() => removeAt(index)}
                sx={{
                  position: "absolute",
                  top: 2,
                  insetInlineEnd: 2,
                  bgcolor: "rgba(0,0,0,0.55)",
                  color: "common.white",
                  width: 22,
                  height: 22,
                  "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                }}
              >
                <Close sx={{ fontSize: 14 }} />
              </IconButton>
            </Box>
          ))}
        </Stack>
      ) : null}
      <Button
        component="label"
        variant="outlined"
        size="small"
        startIcon={<AddPhotoAlternate />}
        disabled={disabled}
      >
        {addLabel}
        <input
          ref={inputRef}
          hidden
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={(e) => addFiles(e.target.files)}
        />
      </Button>
    </Box>
  );
}

export async function resolveProductImagePaths(
  items: ProductImageItem[],
  upload: (files: File[]) => Promise<string[]>
): Promise<string[]> {
  const existing = items.filter((item) => item.kind === "existing").map((item) => item.path);
  const newFiles = items.filter((item) => item.kind === "new").map((item) => item.file);
  if (!newFiles.length) return existing;
  const uploaded = await upload(newFiles);
  return [...existing, ...uploaded];
}

export function productImagesToItems(product?: AdminProduct | null): ProductImageItem[] {
  if (!product?.images?.length) return [];
  return product.images.map((img) => ({ kind: "existing" as const, path: img.path, id: img.id }));
}
